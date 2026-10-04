/**
 * About completion selftest (no network).
 * Run: node scripts/about-completion-selftest.mjs
 */
import assert from 'node:assert/strict';

const ABOUT_COMPLETION_KEYS = ['bio', 'languages', 'talents'];

function getAboutCompletionState(content) {
  const bioComplete = (content.bio ?? '').trim().length > 0;
  const languagesComplete = (content.languages ?? []).length > 0;
  const talentsComplete = (content.talents ?? []).length > 0;
  const missing = [];
  if (!bioComplete) missing.push('bio');
  if (!languagesComplete) missing.push('languages');
  if (!talentsComplete) missing.push('talents');
  return {
    bioComplete,
    languagesComplete,
    talentsComplete,
    complete: missing.length === 0,
    missing,
  };
}

function showAboutBanner(aboutHydrated, content) {
  if (!aboutHydrated) return false;
  return !getAboutCompletionState(content).complete;
}

const base = {
  bio: 'Hello',
  languages: [{ id: 'l1', name: 'English', level: 'C1' }],
  talents: ['Photography'],
  education: [],
  experience: [],
  certifications: [],
  portfolio: [],
  services: [],
  postIds: [],
};

// CASE 1 — Bio missing
{
  const s = getAboutCompletionState({ ...base, bio: '' });
  assert.equal(s.complete, false);
  assert.deepEqual(s.missing, ['bio']);
  assert.equal(showAboutBanner(true, { ...base, bio: '' }), true);
}

// CASE 2 — Languages missing
{
  const s = getAboutCompletionState({ ...base, languages: [] });
  assert.equal(s.complete, false);
  assert.deepEqual(s.missing, ['languages']);
}

// CASE 3 — Talents missing
{
  const s = getAboutCompletionState({ ...base, talents: [] });
  assert.equal(s.complete, false);
  assert.deepEqual(s.missing, ['talents']);
}

// CASE 4 — optional About sections empty → still complete
{
  const s = getAboutCompletionState({
    ...base,
    education: [],
    experience: [],
    certifications: [],
  });
  assert.equal(s.complete, true);
  assert.deepEqual(s.missing, []);
  assert.equal(showAboutBanner(true, base), false);
}

// CASE 5 — Portfolio / Services / Posts empty → still complete
{
  const s = getAboutCompletionState({
    ...base,
    portfolio: [],
    services: [],
    postIds: [],
  });
  assert.equal(s.complete, true);
  assert.equal(showAboutBanner(true, base), false);
}

// Hydration gate — unknown → no banner even if empty
assert.equal(showAboutBanner(false, { bio: '', languages: [], talents: [] }), false);
assert.equal(showAboutBanner(true, { bio: '', languages: [], talents: [] }), true);

// Keys are only the three core sections
assert.deepEqual(ABOUT_COMPLETION_KEYS, ['bio', 'languages', 'talents']);

console.log('about-completion-selftest: OK');
