/**
 * Phase F: signed-out public detail routes map to Guest containers only.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

const signedOut = read('src/navigation/SignedOutNavigator.tsx');
const authenticated = read('src/navigation/AuthenticatedNavigator.tsx');
const types = read('src/navigation/types.ts');

const PUBLIC_ROUTES = [
  'UserProfile',
  'ServiceDetail',
  'JobListingDetail',
  'PostDetail',
  'Reviews',
  'PortfolioProjectDetail',
];

for (const route of PUBLIC_ROUTES) {
  assert.match(
    signedOut,
    new RegExp(`name="${route}"`),
    `SignedOutNavigator must register ${route}`,
  );
  assert.match(
    authenticated,
    new RegExp(`name="${route}"`),
    `AuthenticatedNavigator must keep ${route}`,
  );
}

assert.match(signedOut, /component=\{GuestUserProfileScreen\}/);
assert.match(signedOut, /component=\{GuestServiceDetailScreen\}/);
assert.match(signedOut, /component=\{GuestJobListingDetailScreen\}/);
assert.match(signedOut, /component=\{GuestPostDetailScreen\}/);
assert.match(signedOut, /component=\{GuestReviewsScreen\}/);
assert.match(signedOut, /component=\{GuestPortfolioProjectDetailScreen\}/);

assert.equal(signedOut.includes('component={UserProfileScreen}'), false);
assert.equal(signedOut.includes('component={ServiceDetailScreen}'), false);
assert.equal(signedOut.includes('component={JobListingDetailScreen}'), false);
assert.equal(signedOut.includes('component={PostDetailScreen}'), false);
assert.equal(signedOut.includes('component={ReviewsScreen}'), false);
assert.equal(signedOut.includes('component={PortfolioProjectDetailScreen}'), false);

assert.match(authenticated, /component=\{UserProfileScreen\}/);
assert.match(authenticated, /component=\{ServiceDetailScreen\}/);
assert.match(authenticated, /component=\{JobListingDetailScreen\}/);
assert.match(authenticated, /component=\{PostDetailScreen\}/);
assert.match(authenticated, /component=\{ReviewsScreen\}/);
assert.match(authenticated, /component=\{PortfolioProjectDetailScreen\}/);
assert.equal(authenticated.includes('GuestUserProfileScreen'), false);
assert.equal(authenticated.includes('fetchPublicFeed'), false);

const signedOutTypeStart = types.indexOf('export type SignedOutStackParamList');
const signedOutTypeEnd = types.indexOf('export type RootStackParamList');
const signedOutTypes = types.slice(signedOutTypeStart, signedOutTypeEnd);
for (const route of PUBLIC_ROUTES) {
  assert.match(signedOutTypes, new RegExp(`${route}:`));
}
for (const route of ['Chat', 'Saved', 'Settings', 'Notifications', 'MainTabs']) {
  assert.equal(
    new RegExp(`(^|\\n)\\s+${route}:`, 'm').test(signedOutTypes),
    false,
    `SignedOutStackParamList must not declare ${route}`,
  );
}

assert.match(signedOutTypes, /images\?: string\[]/);
assert.match(signedOutTypes, /serviceId\?: string/);

const profile = read('src/screens/guest/GuestUserProfileScreen.tsx');
assert.match(profile, /isBackendUserId|useGuestProfile/);
assert.match(read('src/hooks/useGuestProfile.ts'), /isBackendUserId/);
assert.match(read('src/hooks/useGuestPost.ts'), /isBackendUserId/);
assert.match(read('src/hooks/useGuestService.ts'), /isBackendUserId/);
assert.match(read('src/hooks/useGuestJob.ts'), /isBackendUserId/);

console.log('guest-public-route-selftest ok');
