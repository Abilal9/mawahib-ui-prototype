import { User } from '../data/types';
import type { ReviewDistribution, ReviewsBundle } from '../data/types/reviews';
import {
  overallAggregate,
  type ReviewAggregate,
} from './reviewSummary';

/** True when this person has at least one published review in either role. */
export function hasRealReviews(
  user: Pick<User, 'reviewCount' | 'rating' | 'accountType' | 'reviewSummary'> | null | undefined,
): boolean {
  return overallAggregate(user).count > 0;
}

/** Overall average, or null when there are no published reviews. */
export function displayableRating(
  user: Pick<User, 'reviewCount' | 'rating' | 'accountType' | 'reviewSummary'> | null | undefined,
): number | null {
  const overall: ReviewAggregate = overallAggregate(user);
  return overall.count > 0 ? overall.average : null;
}

export function formatRatingValue(rating: number): string {
  return rating.toFixed(1);
}

export function emptyReviewDistribution(): ReviewDistribution[] {
  return [
    { stars: 5, percent: 0 },
    { stars: 4, percent: 0 },
    { stars: 3, percent: 0 },
    { stars: 2, percent: 0 },
    { stars: 1, percent: 0 },
  ];
}

/**
 * Reviews UI summary from truthful profile fields only.
 * Never invents review rows or distribution from ratingAvg.
 */
export function buildReviewsSummaryFromProfile(
  user: Pick<User, 'reviewCount' | 'rating' | 'accountType' | 'reviewSummary'> | null | undefined,
): ReviewsBundle {
  const overall = overallAggregate(user);
  const total = overall.count;
  return {
    average: total > 0 ? (overall.average ?? 0) : 0,
    total,
    distribution: emptyReviewDistribution(),
    reviews: [],
  };
}
