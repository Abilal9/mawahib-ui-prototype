import { User } from '../data/types';
import type { ReviewDistribution, ReviewsBundle } from '../data/types/reviews';
import {
  headlineAggregate,
  type ReviewAggregate,
} from './reviewSummary';

/** True when the account-type headline role has at least one published review. */
export function hasRealReviews(
  user: Pick<User, 'reviewCount' | 'rating' | 'accountType' | 'reviewSummary'> | null | undefined,
): boolean {
  return headlineAggregate(user).count > 0;
}

/** Headline average, or null when that role has no published reviews. */
export function displayableRating(
  user: Pick<User, 'reviewCount' | 'rating' | 'accountType' | 'reviewSummary'> | null | undefined,
): number | null {
  const headline: ReviewAggregate = headlineAggregate(user);
  return headline.count > 0 ? headline.average : null;
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
  const headline = headlineAggregate(user);
  const total = headline.count;
  return {
    average: total > 0 ? (headline.average ?? 0) : 0,
    total,
    distribution: emptyReviewDistribution(),
    reviews: [],
  };
}
