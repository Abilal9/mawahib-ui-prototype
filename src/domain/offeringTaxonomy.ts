import type { CanonicalSkillSuggestion } from './profileSkills';

export const MAX_OFFERING_SKILLS = 10;

export interface OfferingSkillChip {
  id: string;
  name: string;
}

export function uniqueOfferingSkills(
  items: readonly OfferingSkillChip[],
): OfferingSkillChip[] {
  const seen = new Set<string>();
  const unique: OfferingSkillChip[] = [];
  for (const item of items) {
    if (seen.has(item.id) || unique.length >= MAX_OFFERING_SKILLS) continue;
    seen.add(item.id);
    unique.push(item);
  }
  return unique;
}

/** Selected category first. Other categories stay available. */
export function rankSkillSuggestions(
  rows: readonly CanonicalSkillSuggestion[],
  categoryId: string | null,
): CanonicalSkillSuggestion[] {
  if (!categoryId) return [...rows];
  return [...rows].sort((a, b) => {
    const aRank = a.categoryId === categoryId ? 0 : 1;
    const bRank = b.categoryId === categoryId ? 0 : 1;
    if (aRank !== bRank) return aRank - bRank;
    return 0;
  });
}

export const MAX_CUSTOM_CATEGORY_LENGTH = 60;

/**
 * NFC, trim, and collapse whitespace. Keep the user's capitalization.
 * Control characters are left intact so they cannot be saved as spaces.
 */
export function displayCustomCategory(value: string): string {
  const nfc = value.normalize('NFC');
  if (/\p{Cc}/u.test(nfc)) return nfc;
  return nfc.trim().replace(/\s+/g, ' ');
}

export function customCategoryError(input: {
  allowsCustomCategory: boolean;
  customCategory: string;
}): string | null {
  if (!input.allowsCustomCategory) return null;
  if (/\p{Cc}/u.test(input.customCategory.normalize('NFC'))) {
    return 'Invalid category description';
  }
  const text = displayCustomCategory(input.customCategory);
  if (!text) return 'Describe this category';
  if ([...text].length > MAX_CUSTOM_CATEGORY_LENGTH) {
    return 'Use 60 characters or fewer';
  }
  return null;
}

export function offeringTaxonomyPayload(input: {
  creating: boolean;
  categoryId: string | null;
  initialCategoryId: string | null;
  skillIds: readonly string[];
  initialSkillIds: readonly string[];
  allowsCustomCategory?: boolean;
  customCategory?: string;
  initialCustomCategory?: string | null;
}): { categoryId?: string; skillIds?: string[]; customCategory?: string | null } {
  const skillIds = [...input.skillIds];
  const changedSkills =
    skillIds.join('\n') !== input.initialSkillIds.join('\n');
  const allows = input.allowsCustomCategory === true;
  const custom = displayCustomCategory(input.customCategory ?? '');
  const initialCustom = displayCustomCategory(input.initialCustomCategory ?? '');
  const customChanged = allows && custom !== initialCustom;
  if (input.creating) {
    return {
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      skillIds,
      ...(allows && custom ? { customCategory: custom } : {}),
    };
  }
  return {
    ...(input.categoryId && input.categoryId !== input.initialCategoryId
      ? { categoryId: input.categoryId }
      : {}),
    ...(changedSkills ? { skillIds } : {}),
    ...(customChanged ? { customCategory: custom } : {}),
  };
}

/**
 * Labels actually shown on Job Detail. This is the compatibility skill list:
 * legacy strings, or canonical names after the server mirrors a skill write.
 * Empty and blank values stay empty so the screen can omit the section.
 */
export function visibleJobSkillLabels(
  skills: readonly (string | null | undefined)[] | null | undefined,
): string[] {
  if (!skills) return [];
  return skills
    .map((skill) => (typeof skill === 'string' ? skill.trim() : ''))
    .filter((skill) => skill.length > 0);
}
