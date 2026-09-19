import { User } from '../data/types';
import type { ReviewDistribution, ReviewsBundle } from '../data/types/reviews';

/** Honest rating presence — schema defaults ratingAvg to 0, so count is canonical. */
export function hasRealReviews(
  user: Pick<User, 'reviewCount' | 'rating'> | null | undefined,
): boolean {
  return (user?.reviewCount ?? 0) > 0;
}

/** Rating value only when reviewCount > 0; otherwise null (not a real average). */
export function displayableRating(
  user: Pick<User, 'reviewCount' | 'rating'> | null | undefined,
): number | null {
  if (!hasRealReviews(user)) return null;
  return user?.rating ?? 0;
}

export function formatRatingValue(rating: number): string {
  return rating.toFixed(rating % 1 === 0 ? 0 : 1);
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
  user: Pick<User, 'reviewCount' | 'rating'> | null | undefined,
): ReviewsBundle {
  const total = user?.reviewCount ?? 0;
  const hasReviews = total > 0;
  return {
    average: hasReviews ? (user?.rating ?? 0) : 0,
    total,
    distribution: emptyReviewDistribution(),
    reviews: [],
  };
}
