import { ProfileContent, User } from '../data/types';
import { repositories } from '../repositories';

const repo = repositories.profile;

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
