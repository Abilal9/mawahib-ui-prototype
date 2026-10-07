import { ReviewsBundle } from '../data/types';
import { buildReviewsSummaryFromProfile } from '../utils/profileRating';

/**
 * Honest empty shell only — never mock review fixtures. The real list comes
 * from `marketplaceApi.listReviewsForUser` (see ReviewsScreen +
 * utils/reviewsMapping.ts).
 */
export const reviewService = {
  getForUser(_userId?: string): ReviewsBundle {
    return buildReviewsSummaryFromProfile({ rating: 0, reviewCount: 0 });
  },
};
