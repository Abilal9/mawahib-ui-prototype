import { ReviewsBundle } from '../data/types';
import { buildReviewsSummaryFromProfile } from '../utils/profileRating';

/**
 * Reviews list product is deferred.
 * Returns an honest empty shell only — never mock review fixtures.
 * Prefer building from a loaded profile via buildReviewsSummaryFromProfile.
 */
export const reviewService = {
  getForUser(_userId?: string): ReviewsBundle {
    return buildReviewsSummaryFromProfile({ rating: 0, reviewCount: 0 });
  },
};
