export const LANGUAGE_LEVELS = [
  'A1',
  'A2',
  'B1',
  'B2',
  'C1',
  'C2',
  'NATIVE',
] as const;

export type LanguageLevelCode = (typeof LANGUAGE_LEVELS)[number];

export const LANGUAGE_LEVEL_LABELS: Record<LanguageLevelCode, string> = {
  A1: 'A1 — Beginner',
  A2: 'A2 — Elementary',
  B1: 'B1 — Intermediate',
  B2: 'B2 — Upper Intermediate',
  C1: 'C1 — Advanced',
  C2: 'C2 — Proficient',
  NATIVE: 'Native / Bilingual',
};

export function isLanguageLevelCode(value: string): value is LanguageLevelCode {
  return (LANGUAGE_LEVELS as readonly string[]).includes(value);
}

/** Display label for canonical or legacy free-text level. */
export function displayLanguageLevel(level: string | null | undefined): string {
  if (!level?.trim()) return '';
  const trimmed = level.trim();
  if (isLanguageLevelCode(trimmed)) return LANGUAGE_LEVEL_LABELS[trimmed];
  const upper = trimmed.toUpperCase();
  if (isLanguageLevelCode(upper)) return LANGUAGE_LEVEL_LABELS[upper];
  // Legacy aliases
  if (/^native/i.test(trimmed) || /bilingual/i.test(trimmed)) {
    return LANGUAGE_LEVEL_LABELS.NATIVE;
  }
  const cefr = trimmed.match(/\b(A1|A2|B1|B2|C1|C2)\b/i);
  if (cefr && isLanguageLevelCode(cefr[1].toUpperCase())) {
    return LANGUAGE_LEVEL_LABELS[cefr[1].toUpperCase() as LanguageLevelCode];
  }
  return trimmed;
}
