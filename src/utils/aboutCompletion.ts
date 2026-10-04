import type { ProfileContent } from '../data/types/profile';

/** Core About fields required for the About-tab completion banner. */
export const ABOUT_COMPLETION_KEYS = ['bio', 'languages', 'talents'] as const;

export type AboutCompletionKey = (typeof ABOUT_COMPLETION_KEYS)[number];

export type AboutCompletionState = {
  bioComplete: boolean;
  languagesComplete: boolean;
  talentsComplete: boolean;
  complete: boolean;
  missing: AboutCompletionKey[];
};

/**
 * Section-specific About completion: Bio + Languages + Talents only.
 * Education / Experience / Certifications / Portfolio / Services / Posts
 * do not participate.
 */
export function getAboutCompletionState(
  content: Pick<ProfileContent, 'bio' | 'languages' | 'talents'>,
): AboutCompletionState {
  const bioComplete = content.bio.trim().length > 0;
  const languagesComplete = content.languages.length > 0;
  const talentsComplete = content.talents.length > 0;
  const missing: AboutCompletionKey[] = [];
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
