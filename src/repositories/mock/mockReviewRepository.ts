import { getReviewsForUser } from '../../data/mock/reviews';
import { ReviewRepository } from '../types';

export const mockReviewRepository: ReviewRepository = {
  getForUser: (userId) => getReviewsForUser(userId),
};
