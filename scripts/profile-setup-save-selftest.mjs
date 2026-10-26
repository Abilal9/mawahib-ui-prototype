/**
 * Profile Setup step 1 saves name and bio in one awaited PATCH.
 * Source scan only.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

const step1 = read('src/screens/profile-setup/ProfileSetupStep1.tsx');
const step2 = read('src/screens/profile-setup/ProfileSetupStep2.tsx');
const profile = read('src/context/ProfileContext.tsx');
const editProfile = read('src/screens/profile/EditProfileScreen.tsx');
const editAbout = read('src/screens/profile/EditAboutSectionScreen.tsx');

function between(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start !== -1 && end !== -1, `missing slice ${startMarker}`);
  return source.slice(start, end);
}

assert.equal(step1.includes('void saveProfileBasics'), false);
assert.equal(step1.includes('void saveBio'), false);
assert.equal(step1.includes('setBio('), false);
assert.equal(step1.includes('saveBio'), false);
assert.equal(step1.split('saveProfileBasics(').length - 1, 1);
assert.equal(step1.includes('bio: bio.trim()'), true);
assert.equal(step1.includes('saveInFlightRef'), true);
assert.equal(step1.includes('mountedRef'), true);
assert.equal(step1.includes('Please select a city.'), true);
assert.equal(step1.includes('Could not save profile'), true);
assert.equal(step1.includes('Please try again.'), true);
assert.equal(step1.includes('disabled={nameMissing || saving}'), true);
assert.equal(step1.split('disabled={nameMissing || saving}').length - 1, 2);
assert.equal(step1.includes('disabled={saving}'), true);

const persist = between(step1, 'const persist = async', 'return (');
assert.ok(persist.indexOf('await saveProfileBasics') < persist.indexOf('afterSuccess()'));
assert.equal(persist.includes('onNext()'), false);
assert.equal(persist.includes('onSave()'), false);
const awaitAt = persist.indexOf('await saveProfileBasics');
const successAt = persist.indexOf('afterSuccess()');
const catchAt = persist.indexOf('catch');
assert.ok(awaitAt !== -1 && awaitAt < successAt && successAt < catchAt);

assert.match(
  profile,
  /bio\?: string;/,
);
assert.equal(
  profile.includes("...(patch.bio !== undefined ? { bio: patch.bio } : {})"),
  true,
);
const persistMe = between(profile, 'const persistMe = useCallback(', 'const persistAboutLists');
assert.equal(persistMe.includes('if (!accessToken || !isSignedIn) return'), false);
assert.equal(persistMe.includes('throw new Error'), true);

const step2Save = between(step2, 'const persistAnd = async', 'return (');
assert.equal(step2Save.includes('if (saveInFlightRef.current) return'), true);
assert.ok(step2Save.indexOf('saveInFlightRef.current = true') < step2Save.indexOf('await setTalentSelections'));
assert.ok(step2Save.indexOf('await setTalentSelections') < step2Save.indexOf('if (mountedRef.current) next()'));
assert.equal(step2.includes('disabled={saving}'), true);
assert.equal(step2.includes('if (saveInFlightRef.current) return;'), true);

const editSave = between(editProfile, 'await saveProfileBasics({', '});');
assert.equal(editSave.includes('bio'), false);
assert.equal(editAbout.includes('await profile.setBio'), true);

console.log('profile-setup-save-selftest: ok');
