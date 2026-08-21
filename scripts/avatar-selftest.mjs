/**
 * Run: node scripts/avatar-selftest.mjs
 * Mirrors src/lib/avatar.ts — null/empty avatar → application default (no Storage file).
 */
import assert from 'node:assert/strict';

const MAWAHIB_DEFAULT_AVATAR_BG = '#F6339A';

function hasCustomAvatar(uri) {
  if (typeof uri === 'number') return true;
  if (typeof uri !== 'string') return false;
  const trimmed = uri.trim();
  return trimmed.length > 0;
}

function defaultAvatarIconSize(avatarSize) {
  if (!Number.isFinite(avatarSize) || avatarSize <= 0) return 20;
  return Math.max(14, Math.min(48, Math.round(avatarSize * 0.45)));
}

/** Same mapping as mapApiUserToUser / peer mappers: null → empty string for FE User.avatar */
function mapAvatarUrl(avatarUrl) {
  return typeof avatarUrl === 'string' ? avatarUrl.trim() : '';
}

assert.equal(MAWAHIB_DEFAULT_AVATAR_BG, '#F6339A');

// 1–2. null / undefined → default
assert.equal(hasCustomAvatar(null), false);
assert.equal(hasCustomAvatar(undefined), false);
assert.equal(hasCustomAvatar(''), false);
assert.equal(hasCustomAvatar('   '), false);
assert.equal(mapAvatarUrl(null), '');
assert.equal(mapAvatarUrl(undefined), '');
assert.equal(mapAvatarUrl(''), '');

// 3. valid URL → custom image
const custom =
  'https://mrtsjgrsponzqrzptymg.supabase.co/storage/v1/object/public/avatars/user.jpg';
assert.equal(hasCustomAvatar(custom), true);
assert.equal(mapAvatarUrl(custom), custom);
assert.equal(hasCustomAvatar(1), true); // require() asset id

// 4–5. Talent / Business new user (avatarUrl null from Nest) → default
const talentBootstrap = { accountType: 'TALENT', avatarUrl: null };
const businessBootstrap = { accountType: 'BUSINESS', avatarUrl: null };
assert.equal(hasCustomAvatar(mapAvatarUrl(talentBootstrap.avatarUrl)), false);
assert.equal(hasCustomAvatar(mapAvatarUrl(businessBootstrap.avatarUrl)), false);

// 6. custom overrides default
assert.equal(hasCustomAvatar(mapAvatarUrl(custom)), true);

// 7. remove avatar → null/empty → default again
assert.equal(hasCustomAvatar(mapAvatarUrl(null)), false);
assert.equal(hasCustomAvatar(mapAvatarUrl('')), false);

assert.equal(defaultAvatarIconSize(40), 18);
assert.equal(defaultAvatarIconSize(88), 40);
assert.equal(defaultAvatarIconSize(20), 14);
assert.equal(defaultAvatarIconSize(0), 20);

console.log('avatar-selftest: OK');
