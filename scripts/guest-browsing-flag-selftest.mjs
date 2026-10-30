/**
 * Phase I: Guest signed-out product is unconditional.
 * No EXPO_PUBLIC_GUEST_BROWSING flag remains.
 * Run: node --no-warnings --experimental-strip-types scripts/guest-browsing-flag-selftest.mjs
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

assert.equal(
  existsSync(join(root, 'src/config/guestBrowsingFlag.ts')),
  false,
);

const splash = read('src/screens/onboarding/SplashScreen2.tsx');
assert.match(splash, /enterSignedOutAt\(\{ name: 'GuestTabs' \}\)/);
assert.equal(splash.includes('isGuestBrowsingEnabled'), false);
assert.equal(splash.includes("name: 'Welcome'"), false);
assert.equal(splash.includes('EXPO_PUBLIC_GUEST_BROWSING'), false);

const dest = read('src/lib/signedOutDestination.ts');
assert.match(dest, /GuestTabs/);
assert.equal(dest.includes('isGuestBrowsingEnabled'), false);
assert.equal(dest.includes('guestEnabled'), false);

const txn = read('src/lib/signOutTransaction.ts');
assert.match(txn, /return 'GuestTabs'/);
assert.equal(txn.includes('guestEnabled'), false);

const auth = read('src/context/AuthContext.tsx');
assert.equal(auth.includes('isGuestBrowsingEnabled'), false);
assert.equal(auth.includes('EXPO_PUBLIC_GUEST_BROWSING'), false);

const signIn = read('src/screens/auth/SignInScreen.tsx');
assert.match(signIn, /Continue as Guest/);
assert.equal(signIn.includes('isGuestBrowsingEnabled'), false);

const tree = [
  'src/context/AuthContext.tsx',
  'src/lib/signedOutDestination.ts',
  'src/lib/signOutTransaction.ts',
  'src/lib/signedOutReason.ts',
  'src/screens/onboarding/SplashScreen2.tsx',
  'src/screens/auth/SignInScreen.tsx',
  'src/navigation/RootNavigator.tsx',
];
for (const file of tree) {
  const source = read(file);
  assert.equal(
    source.includes('EXPO_PUBLIC_GUEST_BROWSING'),
    false,
    `${file} must not reference the removed Guest flag`,
  );
  assert.equal(
    source.includes('guestBrowsingFlag'),
    false,
    `${file} must not import guestBrowsingFlag`,
  );
}

console.log('guest-browsing-flag-selftest ok');
