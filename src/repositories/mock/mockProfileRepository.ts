import {
  emptyProfileContent,
  filledOwnProfile,
  getVisitorProfileContent,
} from '../../data/mock/myProfile';
import { currentUser } from '../../data/mock/users';
import { ProfileRepository } from '../types';

/** Own/visitor profile content seeds — mock. */
export const mockProfileRepository: ProfileRepository = {
  getFilledContent: () => filledOwnProfile,
  getEmptyContent: () => emptyProfileContent,
  getVisitorContent: (userId) => getVisitorProfileContent(userId),
  getSeedUser: () => currentUser,
};
