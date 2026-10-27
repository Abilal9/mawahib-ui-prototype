export interface ReviewAggregate {
  average: number | null;
  count: number;
}

export interface ReviewSummaryPair {
  asProvider: ReviewAggregate;
  asClient: ReviewAggregate;
}

export const EMPTY_AGGREGATE: ReviewAggregate = { average: null, count: 0 };

export const EMPTY_REVIEW_SUMMARY: ReviewSummaryPair = {
  asProvider: EMPTY_AGGREGATE,
  asClient: EMPTY_AGGREGATE,
};

type RatedUser = {
  accountType?: string;
  reviewSummary?: ReviewSummaryPair;
  rating?: number;
  reviewCount?: number;
};

/** Talent headlines use provider-received reviews. Business headlines use client-received reviews. */
export function headlineAggregate(user: RatedUser | null | undefined): ReviewAggregate {
  if (!user) return EMPTY_AGGREGATE;
  if (user.reviewSummary) {
    return user.accountType === 'business'
      ? user.reviewSummary.asClient
      : user.reviewSummary.asProvider;
  }
  const count = user.reviewCount ?? 0;
  return {
    average: count > 0 ? (user.rating ?? null) : null,
    count,
  };
}

/** The other role, only when it has published reviews. */
export function secondaryAggregate(
  user: RatedUser | null | undefined,
): (ReviewAggregate & { role: 'provider' | 'client' }) | null {
  if (!user?.reviewSummary) return null;
  const business = user.accountType === 'business';
  const aggregate = business
    ? user.reviewSummary.asProvider
    : user.reviewSummary.asClient;
  if (aggregate.count <= 0) return null;
  return { ...aggregate, role: business ? 'provider' : 'client' };
}

export function reviewCountLabel(count: number): string {
  return count === 1 ? '1 review' : `${count} reviews`;
}

export function formatReviewAverage(average: number | null | undefined): string | null {
  if (average == null || Number.isNaN(average)) return null;
  return average.toFixed(1);
}

/** Display-only. Eligibility stays on the server deadline. */
export function reviewByLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  return `Review by ${formatted}`;
}

export function ratingFields(aggregate: ReviewAggregate | null | undefined): {
  rating: number;
  reviewCount: number;
} {
  return {
    rating: aggregate?.average ?? 0,
    reviewCount: aggregate?.count ?? 0,
  };
}
