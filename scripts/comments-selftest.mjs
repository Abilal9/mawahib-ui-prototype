/**
 * Comments mapping / delete+report menu helpers selftest.
 * Run: node scripts/comments-selftest.mjs
 */
import assert from 'node:assert/strict';

function canDeleteComment(viewerId, commentAuthorId, postAuthorId) {
  return viewerId === commentAuthorId || viewerId === postAuthorId;
}

function canReportComment(viewerId, commentAuthorId) {
  return viewerId !== commentAuthorId;
}

function commentMenuActions(viewerId, commentAuthorId, postAuthorId) {
  return {
    showMenu: true,
    delete: canDeleteComment(viewerId, commentAuthorId, postAuthorId),
    report: canReportComment(viewerId, commentAuthorId),
  };
}

function appendCommentOnce(prev, created) {
  if (prev.some((c) => c.id === created.id)) return prev;
  return [...prev, created];
}

function mapApiComment(c) {
  return {
    id: c.id,
    userId: c.author.id,
    user: c.author.displayName,
    avatar: c.author.avatarUrl?.trim() || '',
    text: c.text,
    canDelete: Boolean(c.canDelete),
  };
}

// Authorization matrix — Delete
assert.equal(canDeleteComment('A', 'A', 'B'), true); // author
assert.equal(canDeleteComment('B', 'A', 'B'), true); // post owner
assert.equal(canDeleteComment('C', 'A', 'B'), false); // unrelated

// Report — never own comment
assert.equal(canReportComment('A', 'A'), false);
assert.equal(canReportComment('A', 'B'), true);

// TEST A: own comment on own post → Delete only
assert.deepEqual(commentMenuActions('A', 'A', 'A'), {
  showMenu: true,
  delete: true,
  report: false,
});

// TEST B: someone else's comment on own post → Delete + Report
assert.deepEqual(commentMenuActions('A', 'B', 'A'), {
  showMenu: true,
  delete: true,
  report: true,
});

// TEST C: own comment on someone else's post → Delete only
assert.deepEqual(commentMenuActions('B', 'B', 'A'), {
  showMenu: true,
  delete: true,
  report: false,
});

// TEST D: someone else's comment on someone else's post → Report only
assert.deepEqual(commentMenuActions('C', 'B', 'A'), {
  showMenu: true,
  delete: false,
  report: true,
});

// Dedupe after race: refetch already included created id
const existing = [{ id: 'c1', text: 'Nice work' }];
const created = { id: 'c1', text: 'Nice work' };
assert.deepEqual(appendCommentOnce(existing, created), existing);
assert.deepEqual(appendCommentOnce([], created), [created]);

const mapped = mapApiComment({
  id: 'c1',
  postId: 'p1',
  text: 'hi',
  createdAt: '2026-01-01T00:00:00.000Z',
  author: {
    id: 'u1',
    displayName: 'Layla',
    avatarUrl: null,
  },
  canDelete: true,
});
assert.equal(mapped.canDelete, true);
assert.equal(mapped.userId, 'u1');

console.log('comments-selftest: ok');
