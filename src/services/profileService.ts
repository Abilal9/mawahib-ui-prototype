import { ProfileContent, User } from '../data/types';
import { repositories } from '../repositories';

const repo = repositories.profile;

/**
 * @deprecated Temporary about-section helpers for local-only fields.
 * Do not use for identity, portfolio, or services — those are Nest-backed.
 */
export const profileService = {
  getFilledContent(): ProfileContent {
    return repo.getFilledContent();
  },

  getEmptyContent(): ProfileContent {
    return repo.getEmptyContent();
  },

  getVisitorContent(userId: string): ProfileContent {
    return repo.getVisitorContent(userId);
  },

  getSeedUser(): User {
    return repo.getSeedUser();
  },
};
