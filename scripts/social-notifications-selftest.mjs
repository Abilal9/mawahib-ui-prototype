/**
 * Social notification + likes-list helper selftest.
 * Run: node scripts/social-notifications-selftest.mjs
 */
import assert from 'node:assert/strict';

function shouldNotifyLike(viewerId, postAuthorId, alreadyLiked) {
  if (alreadyLiked) return false;
  if (viewerId === postAuthorId) return false;
  return true;
}

function shouldNotifyComment(viewerId, postAuthorId) {
  return viewerId !== postAuthorId;
}

function truncatePreview(text, max = 100) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function mapNotifType(type) {
  if (type === 'post_liked') return 'like';
  if (type === 'post_commented') return 'comment';
  return 'system';
}

/** Likes row secondary line — title only; never @username. */
function likesSecondaryLine(user) {
  const title = typeof user.title === 'string' ? user.title.trim() : '';
  return title || null;
}

assert.equal(shouldNotifyLike('B', 'A', false), true);
assert.equal(shouldNotifyLike('B', 'A', true), false);
assert.equal(shouldNotifyLike('A', 'A', false), false);
assert.equal(shouldNotifyComment('B', 'A'), true);
assert.equal(shouldNotifyComment('A', 'A'), false);
assert.equal(truncatePreview('hi'), 'hi');
assert.equal(truncatePreview('x'.repeat(120)).length, 100);
assert.equal(mapNotifType('post_liked'), 'like');
assert.equal(mapNotifType('post_commented'), 'comment');

assert.equal(
  likesSecondaryLine({
    displayName: 'Layla Hassan',
    username: 'layla_talent_dev',
    title: 'UI/UX Designer',
  }),
  'UI/UX Designer',
);
assert.equal(
  likesSecondaryLine({
    displayName: 'Omar Khalid',
    username: 'omar_talent_dev',
    title: null,
  }),
  null,
);
assert.equal(
  likesSecondaryLine({
    displayName: 'Najd Studio',
    username: 'najd_studio_dev',
    title: '   ',
  }),
  null,
);
assert.equal(
  likesSecondaryLine({
    displayName: 'Najd Studio',
    username: 'najd_studio_dev',
    title: 'Creative Studio',
  }),
  'Creative Studio',
);

console.log('social-notifications-selftest: ok');
