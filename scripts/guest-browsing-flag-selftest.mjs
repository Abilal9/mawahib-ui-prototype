/**
 * Phase H: Guest Browsing implementation flag defaults ON.
 * Rollback with EXPO_PUBLIC_GUEST_BROWSING=false. Remove in Phase I.
 * Run: node --no-warnings --experimental-strip-types scripts/guest-browsing-flag-selftest.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseGuestBrowsingFlag } from '../src/config/guestBrowsingFlag.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

assert.equal(parseGuestBrowsingFlag(undefined), true);
assert.equal(parseGuestBrowsingFlag(null), true);
assert.equal(parseGuestBrowsingFlag(''), true);
assert.equal(parseGuestBrowsingFlag('false'), false);
assert.equal(parseGuestBrowsingFlag('FALSE'), false);
assert.equal(parseGuestBrowsingFlag('true'), true);
assert.equal(parseGuestBrowsingFlag('TRUE'), true);
assert.equal(parseGuestBrowsingFlag(' true '), true);
assert.equal(parseGuestBrowsingFlag('1'), true);
assert.equal(parseGuestBrowsingFlag('yes'), true);

const flag = read('src/config/guestBrowsingFlag.ts');
assert.match(flag, /EXPO_PUBLIC_GUEST_BROWSING/);
assert.match(flag, /Remove in Phase I/);
assert.equal(flag.includes('launchdarkly'), false);
assert.equal(flag.includes('statsig'), false);

const splash = read('src/screens/onboarding/SplashScreen2.tsx');
const welcomeAt = splash.indexOf("name: 'Welcome'");
const guestAt = splash.indexOf("name: 'GuestTabs'");
const flagAt = splash.indexOf('isGuestBrowsingEnabled()');
assert.ok(welcomeAt !== -1 && guestAt !== -1 && flagAt !== -1);
assert.ok(flagAt < guestAt);
assert.match(splash, /enterSignedOutAt\(\{ name: 'Welcome'/);

const rootNavigator = read('src/navigation/RootNavigator.tsx');
assert.match(rootNavigator, /resolveSignedOutDestination/);
assert.match(rootNavigator, /return 'SignIn'/);
const defaultFn = rootNavigator.slice(
  rootNavigator.indexOf('function defaultSignedOutRoute'),
  rootNavigator.indexOf('function SignedOutBranch'),
);
assert.match(defaultFn, /input\.recoveryLocked \|\| input\.hasSession/);
assert.match(defaultFn, /resolveSignedOutDestination/);
const dest = read('src/lib/signedOutDestination.ts');
assert.match(dest, /isGuestBrowsingEnabled\(\)/);
assert.match(dest, /GuestTabs/);

console.log('guest-browsing-flag-selftest ok');
