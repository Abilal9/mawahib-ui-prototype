import { ReviewsBundle } from '../data/types';
import { repositories } from '../repositories';

export const reviewService = {
  getForUser(userId?: string): ReviewsBundle {
    return repositories.reviews.getForUser(userId);
  },
};
