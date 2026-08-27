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

console.log('posts-feed-selftest: ok');
