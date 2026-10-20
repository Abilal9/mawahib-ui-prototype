import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  acceptSuggestionResponse,
  addCanonicalSkill,
  addCustomSkill,
  exactSuggestion,
  moveSkill,
  selectionsFromProfile,
  skillSelectionPayload,
  suggestionsForDraft,
  uniqueSkillSuggestions,
} from '../src/domain/profileSkills.ts';

const mixed = selectionsFromProfile({
  skillSelections: [
    { name: 'Wedding Photography', skillId: 'wed' },
    { name: 'Underwater Photography', skillId: null },
  ],
});
assert.deepEqual(skillSelectionPayload(mixed), {
  skillSelections: [{ skillId: 'wed' }, { text: 'Underwater Photography' }],
});

const added = addCanonicalSkill(mixed, {
  id: 'photo',
  nameEn: 'Photography',
  matchedTerm: 'Photographer',
});
assert.equal(added.at(-1)?.skillId, 'photo');
assert.equal(addCanonicalSkill(added, {
  id: 'photo',
  nameEn: 'Photography',
  matchedTerm: 'Photography',
}).length, added.length);

const custom = addCustomSkill(added, '  Drums  ');
assert.equal(custom.at(-1)?.name, 'Drums');
assert.equal(custom.at(-1)?.skillId, null);
assert.equal(addCustomSkill(custom, 'drums').length, custom.length);
assert.equal(addCustomSkill(custom, '   ').length, custom.length);

assert.equal(
  exactSuggestion(
    [{ id: 'photo', nameEn: 'Photography', matchedTerm: 'Photographer' }],
    'photographer',
  )?.id,
  'photo',
);

assert.deepEqual(
  moveSkill(custom, 0, 2).map((item) => item.name),
  [custom[1].name, custom[2].name, custom[0].name, custom[3].name],
);

const fallback = selectionsFromProfile({ skills: ['Drums'] });
assert.deepEqual(fallback, [{ name: 'Drums', skillId: null }]);

const setup = readFileSync(
  new URL('../src/screens/profile-setup/ProfileSetupStep2.tsx', import.meta.url),
  'utf8',
);
assert.equal(setup.includes('AVAILABLE_SKILLS'), false);
assert.equal(setup.includes('Motion Design'), false);
assert.equal(setup.includes('TalentChipsEditor'), true);
assert.equal(setup.includes('setTalentSelections'), true);
assert.equal(setup.includes('await setTalentSelections'), true);
assert.equal(setup.includes('void setTalentSelections'), false);

const edit = readFileSync(
  new URL('../src/screens/profile/EditAboutSectionScreen.tsx', import.meta.url),
  'utf8',
);
assert.equal(edit.includes('setTalentSelections'), true);
assert.equal(edit.includes('TalentChipsEditor'), true);

const photoSuggestions = uniqueSkillSuggestions([
  { id: 'photo', nameEn: 'Photography', matchedTerm: 'Photographer' },
  { id: 'photo', nameEn: 'Photography', matchedTerm: 'Photography' },
  { id: 'edit', nameEn: 'Photo Editing', matchedTerm: 'Photo Editing' },
]);
assert.deepEqual(
  photoSuggestions.map((row) => row.id),
  ['photo', 'edit'],
);
assert.equal(exactSuggestion(photoSuggestions, 'photography')?.id, 'photo');
assert.equal(exactSuggestion(photoSuggestions, 'photographer')?.id, 'photo');
assert.equal(exactSuggestion(photoSuggestions, 'photo'), undefined);
assert.equal(
  exactSuggestion(
    [{ id: 'photo', nameEn: 'Photography', matchedTerm: 'Photography' }],
    'Underwater Photography',
  ),
  undefined,
);
assert.equal(
  acceptSuggestionResponse(1, 2, photoSuggestions),
  null,
);
assert.equal(
  acceptSuggestionResponse(2, 2, photoSuggestions)?.length,
  2,
);
assert.deepEqual(
  suggestionsForDraft('photo', 'photography', photoSuggestions),
  [],
);
assert.equal(
  suggestionsForDraft('photography', 'photography', photoSuggestions).length,
  2,
);

const editor = readFileSync(
  new URL('../src/components/profile/TalentChipsEditor.tsx', import.meta.url),
  'utf8',
);
assert.equal(editor.includes('key={suggestion.id}'), true);
assert.equal(editor.includes('{suggestion.matchedTerm}'), false);
assert.equal(editor.includes('key={talent.skillId ?? `custom:${talent.name}`}'), true);
assert.equal(editor.includes('${talent.skillId ?? \'custom\'}-${talent.name}-${index}'), false);
assert.equal(editor.includes('key="add-custom-skill"'), true);
assert.equal(editor.includes('setSuggestions([...suggestions'), false);
assert.equal(editor.includes('acceptSuggestionResponse'), true);
assert.equal(editor.includes('suggestionsForDraft'), true);
assert.equal(editor.includes('if (lookupPending) return;'), true);

const api = readFileSync(
  new URL('../src/services/taxonomyApi.ts', import.meta.url),
  'utf8',
);
assert.equal(api.includes("'/taxonomy'"), true);
assert.equal(api.includes('/taxonomy/skills'), true);
assert.equal(api.includes('supabase.from'), false);

console.log('profile-skills-selftest: ok');
