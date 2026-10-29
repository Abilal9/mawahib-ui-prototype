/**
 * Sticky pendingSignup.userId merge, session stamp, and bootstrap fallbacks.
 * Run: node --no-warnings --experimental-strip-types scripts/pending-signup-sticky-selftest.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const mem = new Map();
globalThis.localStorage = {
  getItem: (key) => (mem.has(key) ? mem.get(key) : null),
  setItem: (key, value) => {
    mem.set(key, String(value));
  },
  removeItem: (key) => {
    mem.delete(key);
  },
};

const {
  clearPendingSignup,
  loadPendingSignup,
  savePendingSignup,
  sessionAllowsSignupFallbacks,
  stampPendingSignupFromSession,
} = await import('../src/lib/pendingSignup.ts');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

function reset() {
  mem.clear();
  clearPendingSignup();
}

// 1. initial save no userId
reset();
savePendingSignup({
  email: 'a@example.com',
  phoneE164: '+966501234567',
  displayName: 'Ada',
  accountType: 'talent',
  city: 'Riyadh',
});
assert.equal(loadPendingSignup()?.userId, undefined);
assert.equal(loadPendingSignup()?.phoneE164, '+966501234567');

// 2. stamp A from real session
stampPendingSignupFromSession(
  { user: { id: 'user-a', email: 'a@example.com' } },
);
assert.equal(loadPendingSignup()?.userId, 'user-a');

// 3. save update omits userId → A preserved
savePendingSignup({
  email: 'a@example.com',
  displayName: 'Ada Lovelace',
});
assert.equal(loadPendingSignup()?.userId, 'user-a');
assert.equal(loadPendingSignup()?.displayName, 'Ada Lovelace');
assert.equal(loadPendingSignup()?.phoneE164, '+966501234567');

// 4. save update userId undefined → A preserved
savePendingSignup({
  email: 'a@example.com',
  userId: undefined,
  city: 'Jeddah',
});
assert.equal(loadPendingSignup()?.userId, 'user-a');
assert.equal(loadPendingSignup()?.city, 'Jeddah');

// 5. save null → A preserved
savePendingSignup({
  email: 'a@example.com',
  userId: null,
});
assert.equal(loadPendingSignup()?.userId, 'user-a');

// 6. save conflicting B → ignore
savePendingSignup({
  email: 'a@example.com',
  userId: 'user-b',
});
assert.equal(loadPendingSignup()?.userId, 'user-a');

// 7. resend → A preserved
savePendingSignup(
  {
    email: 'a@example.com',
    displayName: 'Ada',
  },
  { otpRequested: true },
);
assert.equal(loadPendingSignup()?.userId, 'user-a');
assert.equal(typeof loadPendingSignup()?.lastOtpRequestedAt, 'number');

// 8. same email different session B → local fields ignored
assert.equal(
  sessionAllowsSignupFallbacks({
    userId: 'user-b',
    email: 'a@example.com',
  }),
  false,
);

// 9. different email → local fields ignored
assert.equal(
  sessionAllowsSignupFallbacks({
    userId: 'user-a',
    email: 'b@example.com',
  }),
  false,
);
assert.equal(
  sessionAllowsSignupFallbacks({
    userId: 'user-b',
    email: 'b@example.com',
  }),
  false,
);

// Email change is a new signup flow: do not carry userId or previous fields.
savePendingSignup({
  email: 'b@example.com',
  displayName: 'Bee',
  phoneE164: '+966509999999',
});
assert.equal(loadPendingSignup()?.email, 'b@example.com');
assert.equal(loadPendingSignup()?.userId, undefined);
assert.equal(loadPendingSignup()?.displayName, 'Bee');
assert.equal(loadPendingSignup()?.phoneE164, '+966509999999');

assert.equal(
  sessionAllowsSignupFallbacks({
    userId: 'user-a',
    email: 'a@example.com',
    basicsEmail: 'b@example.com',
  }),
  false,
);

// 10. clear → fresh record may have no userId
clearPendingSignup();
assert.equal(loadPendingSignup(), null);
savePendingSignup({ email: 'fresh@example.com' });
assert.equal(loadPendingSignup()?.userId, undefined);

// Email matching before userId exists
reset();
savePendingSignup({
  email: 'a@example.com',
  phoneE164: '+966501111111',
});
assert.equal(
  sessionAllowsSignupFallbacks({
    userId: 'user-a',
    email: 'a@example.com',
  }),
  true,
);
assert.equal(
  sessionAllowsSignupFallbacks({
    userId: 'user-a',
    email: 'b@example.com',
  }),
  false,
);
assert.equal(
  sessionAllowsSignupFallbacks({
    userId: 'user-a',
    email: '',
  }),
  false,
);

// Stamp without matching email does not bind
reset();
savePendingSignup({ email: 'a@example.com' });
stampPendingSignupFromSession({
  user: { id: 'user-b', email: 'b@example.com' },
});
assert.equal(loadPendingSignup()?.userId, undefined);

// createIfMissing only when no record
reset();
stampPendingSignupFromSession(
  { user: { id: 'user-a', email: 'a@example.com' } },
  { createIfMissing: true },
);
assert.equal(loadPendingSignup()?.userId, 'user-a');
assert.equal(loadPendingSignup()?.email, 'a@example.com');

const auth = read('src/context/AuthContext.tsx');
const pendingLib = read('src/lib/pendingSignup.ts');

assert.match(pendingLib, /userId\?: string;/);
assert.match(pendingLib, /stickyUserId/);
assert.match(pendingLib, /sessionAllowsSignupFallbacks/);
assert.match(auth, /sessionAllowsSignupFallbacks/);
assert.match(auth, /allowedFallbacks/);

// 11. signUp().data.user without session does not stamp
const register = auth.slice(
  auth.indexOf('const registerWithEmail'),
  auth.indexOf('const verifySignupOtp'),
);
const otpSent = register.slice(register.indexOf('// Fresh signup'));
assert.match(otpSent, /savePendingSignup\(/);
assert.equal(otpSent.includes('data.user.id'), false);
assert.equal(otpSent.includes('userId:'), false);
assert.equal(register.includes('data.user.id'), false);

// 12. legitimate OTP session stamps before hydrate
const verify = auth.slice(
  auth.indexOf('const verifySignupOtp'),
  auth.indexOf('const sendPhoneOtp'),
);
assert.ok(
  verify.indexOf('stampPendingSignupFromSession(data.session') !== -1 &&
    verify.indexOf('stampPendingSignupFromSession(data.session') <
      verify.indexOf('hydrateBackendUser(data.session)'),
);
const sessionReady = register.slice(register.indexOf('if (data.session)'));
assert.ok(
  sessionReady.indexOf('stampPendingSignupFromSession(data.session') <
    sessionReady.indexOf('hydrateBackendUser(data.session'),
);

console.log('pending-signup-sticky-selftest ok');
