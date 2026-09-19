/**
 * Profile honesty / presentation selftest (no network).
 * Run: node scripts/profile-honesty-selftest.mjs
 */
import assert from 'node:assert/strict';

function hasRealReviews(user) {
  return (user?.reviewCount ?? 0) > 0;
}

function displayableRating(user) {
  if (!hasRealReviews(user)) return null;
  return user?.rating ?? 0;
}

function formatRatingValue(rating) {
  return rating.toFixed(rating % 1 === 0 ? 0 : 1);
}

function emptyReviewDistribution() {
  return [
    { stars: 5, percent: 0 },
    { stars: 4, percent: 0 },
    { stars: 3, percent: 0 },
    { stars: 2, percent: 0 },
    { stars: 1, percent: 0 },
  ];
}

function buildReviewsSummaryFromProfile(user) {
  const total = user?.reviewCount ?? 0;
  const hasReviews = total > 0;
  return {
    average: hasReviews ? (user?.rating ?? 0) : 0,
    total,
    distribution: emptyReviewDistribution(),
    reviews: [],
  };
}

function identityLine(user) {
  const name = user.name?.trim() || 'Member';
  const title = user.title?.trim();
  return title ? `${name}\n${title}` : name;
}

const DEFAULT_PROFILE_TITLE = 'Creative Professional';

function displayProfileTitle(title) {
  const trimmed = title?.trim();
  return trimmed ? trimmed : DEFAULT_PROFILE_TITLE;
}

// Rating honesty
assert.equal(hasRealReviews({ reviewCount: 0, rating: 0 }), false);
assert.equal(displayableRating({ reviewCount: 0, rating: 0 }), null);
{
  const bundle = buildReviewsSummaryFromProfile({ reviewCount: 0, rating: 0 });
  assert.equal(bundle.total, 0);
  assert.equal(bundle.average, 0);
  assert.equal(bundle.reviews.length, 0);
  assert.ok(bundle.distribution.every((d) => d.percent === 0));
}

assert.equal(hasRealReviews({ reviewCount: 0, rating: 4.7 }), false);
assert.equal(displayableRating({ reviewCount: 0, rating: 4.7 }), null);
{
  const bundle = buildReviewsSummaryFromProfile({ reviewCount: 0, rating: 4.7 });
  assert.equal(bundle.total, 0);
  assert.equal(bundle.average, 0);
  assert.equal(bundle.reviews.length, 0);
}

assert.equal(hasRealReviews({ reviewCount: 10, rating: 4.7 }), true);
assert.equal(displayableRating({ reviewCount: 10, rating: 4.7 }), 4.7);
{
  const bundle = buildReviewsSummaryFromProfile({ reviewCount: 10, rating: 4.7 });
  assert.equal(bundle.total, 10);
  assert.equal(bundle.average, 4.7);
  assert.equal(bundle.reviews.length, 0);
  assert.ok(bundle.distribution.every((d) => d.percent === 0));
}

assert.equal(formatRatingValue(5), '5');
assert.equal(formatRatingValue(4.5), '4.5');

// Canonical profile title
assert.equal(DEFAULT_PROFILE_TITLE, 'Creative Professional');
assert.equal(displayProfileTitle(null), 'Creative Professional');
assert.equal(displayProfileTitle(undefined), 'Creative Professional');
assert.equal(displayProfileTitle(''), 'Creative Professional');
assert.equal(displayProfileTitle('   '), 'Creative Professional');
assert.equal(displayProfileTitle('Head Creative Exec'), 'Head Creative Exec');
assert.equal(displayProfileTitle('  Designer  '), 'Designer');
assert.notEqual(displayProfileTitle(null), 'Member');

const zeroUser = { rating: 0, reviewCount: 0 };
assert.equal(zeroUser.rating ?? 0, 0);
assert.equal(zeroUser.reviewCount ?? 0, 0);
assert.equal(null ?? 5, 5);
assert.equal(undefined ?? 106, 106);

assert.equal(identityLine({ name: 'Sara', title: 'Designer' }), 'Sara\nDesigner');
assert.equal(identityLine({ name: 'Sara', title: '' }), 'Sara');
assert.ok(!identityLine({ name: 'Sara', title: 'Photographer' }).includes('@'));

function applyDraft(persisted, draft) {
  if (draft.kind === 'keep') return persisted;
  if (draft.kind === 'remove') return null;
  return draft.uri;
}
assert.equal(applyDraft('https://cdn/a.jpg', { kind: 'keep' }), 'https://cdn/a.jpg');
assert.equal(applyDraft('https://cdn/a.jpg', { kind: 'remove' }), null);
assert.equal(
  applyDraft('https://cdn/a.jpg', { kind: 'local', uri: 'file:///b.jpg' }),
  'file:///b.jpg',
);

console.log('profile-honesty-selftest: OK');
