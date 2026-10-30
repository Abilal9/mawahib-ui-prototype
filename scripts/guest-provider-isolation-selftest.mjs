/**
 * Phase E: private providers mount only in the authenticated product tree.
 * Source scan only.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

const PRIVATE_PROVIDERS = [
  'SavedProvider',
  'ProfileProvider',
  'PostsProvider',
  'NotificationsProvider',
  'MessagingUnreadProvider',
  'UserJobsProvider',
  'ConnectionsProvider',
];

const app = read('App.tsx');
const rootNavigator = read('src/navigation/RootNavigator.tsx');
const providers = read('src/navigation/AuthenticatedProviders.tsx');
const signedOut = read('src/navigation/SignedOutNavigator.tsx');
const guestTabs = read('src/navigation/GuestTabs.tsx');
const guestHome = read('src/screens/guest/GuestHomeScreen.tsx');
const guestExplore = read('src/screens/guest/GuestExploreScreen.tsx');
const guestAccount = read('src/screens/guest/GuestAccountScreen.tsx');
const guestProfile = read('src/screens/guest/GuestUserProfileScreen.tsx');
const guestPost = read('src/screens/guest/GuestPostDetailScreen.tsx');
const guestService = read('src/screens/guest/GuestServiceDetailScreen.tsx');
const guestJob = read('src/screens/guest/GuestJobListingDetailScreen.tsx');
const messaging = read('src/context/MessagingUnreadContext.tsx');
const notifications = read('src/context/NotificationsContext.tsx');
const userJobs = read('src/context/UserJobsContext.tsx');

for (const name of PRIVATE_PROVIDERS) {
  assert.equal(
    app.includes(name),
    false,
    `App.tsx must not mount ${name} globally`,
  );
  assert.match(
    providers,
    new RegExp(`<${name}[\\s>]`),
    `AuthenticatedProviders must mount ${name}`,
  );
  assert.equal(
    signedOut.includes(name),
    false,
    `SignedOutNavigator must not mount ${name}`,
  );
}

assert.match(rootNavigator, /<AuthenticatedProviders/);
assert.match(rootNavigator, /key=\{apiUser\.id\}/);
assert.match(rootNavigator, /userId=\{apiUser\.id\}/);
assert.equal(guestTabs.includes('MessagingUnreadProvider'), false);
assert.equal(guestTabs.includes('NotificationsProvider'), false);
assert.equal(guestHome.includes('usePosts'), false);
assert.equal(guestExplore.includes('useSaved'), false);
assert.equal(guestAccount.includes('useMyProfile'), false);
assert.equal(guestProfile.includes('ProfileContext'), false);
assert.equal(guestProfile.includes('useConnections'), false);
assert.equal(guestPost.includes('usePosts'), false);
assert.equal(guestService.includes('useSaved'), false);
assert.equal(guestJob.includes('useUserJobs'), false);

assert.match(messaging, /usePolling\(refresh, INBOX_POLL_MS/);
assert.match(notifications, /usePolling\(refresh, NOTIFICATIONS_POLL_MS/);
assert.match(userJobs, /usePolling\(refreshUnread, INBOX_POLL_MS/);

assert.match(app, /AuthProvider/);
assert.match(app, /NavigationContainer/);
assert.match(app, /AuthTransitionOverlay/);
assert.equal(app.includes('SavedProvider'), false);
assert.equal(app.includes('PostsProvider'), false);

console.log('guest-provider-isolation-selftest ok');
