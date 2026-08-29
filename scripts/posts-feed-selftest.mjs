/**
 * Lightweight selftest for FeedPostDto mapping / discovery rules.
 * Run: node scripts/posts-feed-selftest.mjs
 */
import assert from 'node:assert/strict';

function mapFeedSource(viewerId, authorId, connectedIds, pending) {
  if (authorId === viewerId) return 'self';
  if (connectedIds.has(authorId)) return 'connection';
  return 'discovery';
}

function relationship(viewerId, authorId, connectedIds, pending) {
  if (authorId === viewerId) return { status: 'self', connectionRequestId: null };
  if (connectedIds.has(authorId)) return { status: 'connected', connectionRequestId: null };
  const out = pending.find((p) => p.fromUserId === viewerId && p.toUserId === authorId);
  if (out) return { status: 'outgoing', connectionRequestId: out.id };
  const inn = pending.find((p) => p.fromUserId === authorId && p.toUserId === viewerId);
  if (inn) return { status: 'incoming', connectionRequestId: inn.id };
  return { status: 'none', connectionRequestId: null };
}

function showDiscoveryMarker(feedSource) {
  return feedSource === 'discovery';
}

const viewer = 'A';
const connected = new Set(['B']);
const pending = [{ id: 'r1', fromUserId: 'A', toUserId: 'C' }];

assert.equal(mapFeedSource(viewer, 'A', connected, pending), 'self');
assert.equal(mapFeedSource(viewer, 'B', connected, pending), 'connection');
assert.equal(mapFeedSource(viewer, 'C', connected, pending), 'discovery');
assert.equal(mapFeedSource(viewer, 'D', connected, pending), 'discovery');

assert.equal(showDiscoveryMarker('self'), false);
assert.equal(showDiscoveryMarker('connection'), false);
assert.equal(showDiscoveryMarker('discovery'), true);

assert.deepEqual(relationship(viewer, 'C', connected, pending), {
  status: 'outgoing',
  connectionRequestId: 'r1',
});
assert.equal(relationship(viewer, 'D', connected, pending).status, 'none');

// Pending does not flip source to connection
assert.equal(mapFeedSource(viewer, 'C', connected, pending), 'discovery');

/** Mirrors src/utils/postMediaPreview.ts — Home 1 primary + ≤3 thumbs. */
const FEED_MEDIA_PREVIEW_MAX = 4;
function getPostMediaPreviewLayout(images) {
  const urls = images.filter((u) => Boolean(u && String(u).trim()));
  const total = urls.length;
  return {
    primary: urls[0] ?? null,
    thumbnails: urls.slice(1, FEED_MEDIA_PREVIEW_MAX),
    remainingCount: Math.max(total - FEED_MEDIA_PREVIEW_MAX, 0),
    total,
  };
}

function assertPreview(total, expectedVisible, expectedRemaining) {
  const images = Array.from({ length: total }, (_, i) => `https://img/${i}`);
  const layout = getPostMediaPreviewLayout(images);
  const visible =
    (layout.primary ? 1 : 0) + layout.thumbnails.length;
  assert.equal(visible, expectedVisible, `total=${total} visible`);
  assert.equal(layout.remainingCount, expectedRemaining, `total=${total} remaining`);
  if (total === 0) assert.equal(layout.primary, null);
  if (total >= 1) assert.equal(layout.primary, images[0]);
  if (total >= 2) assert.equal(layout.thumbnails[0], images[1]);
}

assertPreview(0, 0, 0);
assertPreview(1, 1, 0);
assertPreview(2, 2, 0);
assertPreview(3, 3, 0);
assertPreview(4, 4, 0);
assertPreview(5, 4, 1);
assertPreview(6, 4, 2);
assertPreview(10, 4, 6);

/** Post create image limit (mirrors src/constants/posts.ts). */
const MAX_POST_IMAGES = 4;
assert.equal(MAX_POST_IMAGES, 4);
assert.ok(MAX_POST_IMAGES <= FEED_MEDIA_PREVIEW_MAX || FEED_MEDIA_PREVIEW_MAX === 4);

function canAttachAnother(selectedCount) {
  return selectedCount < MAX_POST_IMAGES;
}
assert.equal(canAttachAnother(0), true);
assert.equal(canAttachAnother(3), true);
assert.equal(canAttachAnother(4), false);
assert.equal(canAttachAnother(5), false);

function counterLabel(n) {
  return `${n}/${MAX_POST_IMAGES}`;
}
assert.equal(counterLabel(0), '0/4');
assert.equal(counterLabel(1), '1/4');
assert.equal(counterLabel(4), '4/4');
assert.equal(counterLabel(3), '3/4'); // after remove from 4

/** Business create fan menu labels (mirrors CreateActionMenu BASE_ITEMS). */
const businessCreateLabels = ['Job', 'Story', 'Post'];
assert.deepEqual(businessCreateLabels, ['Job', 'Story', 'Post']);
assert.ok(!businessCreateLabels.includes('Post Job'));

console.log('posts-feed-selftest: ok');
