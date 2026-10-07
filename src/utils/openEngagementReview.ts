/** Minimal navigate surface — works with stack + tab composite navigators. */
type ReviewNavigate = {
  navigate(
    name: 'WriteReview',
    params: {
      jobId: string;
      initialRating?: number;
      engagementId?: string;
      conversationId?: string;
      workRequestId?: string;
    },
  ): void;
};

export interface OpenEngagementReviewParams {
  engagementId?: string;
  /** Falls back to `workRequestId`, then `engagementId`. */
  jobId?: string;
  workRequestId?: string;
  initialRating?: number;
  conversationId?: string;
}

/**
 * Single entry into the WriteReview route so every surface (History, request
 * detail, chat, notifications) passes the same params.
 */
export function openEngagementReview(
  navigation: ReviewNavigate,
  params: OpenEngagementReviewParams,
) {
  const jobId = params.jobId ?? params.workRequestId ?? params.engagementId;
  if (!jobId) return;
  navigation.navigate('WriteReview', {
    jobId,
    engagementId: params.engagementId,
    workRequestId: params.workRequestId,
    initialRating: params.initialRating,
    conversationId: params.conversationId,
  });
}
