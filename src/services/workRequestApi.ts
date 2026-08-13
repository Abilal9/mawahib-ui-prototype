import { apiRequest } from '../lib/apiClient';
import { ApiEngagement, ApiEngagementStatus } from './marketplaceApi';

/** Entry point a work request came from. */
export type WorkRequestSource =
  | 'job_posting'
  | 'service_request'
  | 'direct_request';

/**
 * Negotiation status. `pending_payment` is the accepted terminal state —
 * the engagement it creates waits for money (Phase 5).
 */
export type WorkRequestStatus =
  | 'pending'
  | 'changes_requested'
  | 'pending_payment'
  | 'rejected'
  | 'withdrawn';

export type WorkRequestEventType =
  | 'created'
  | 'changes_requested'
  | 'changes_accepted'
  | 'changes_declined'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'viewed'
  | 'listing_closed'
  | 'note';

/** Free-text terms snapshot; prices are labels, not amounts. */
export interface WorkRequestTerms {
  title: string;
  scope: string;
  price: string;
  currency: string;
  deadlineLabel: string;
  notes: string;
  location?: string | null;
  employmentType?: string | null;
  packageTier?: string | null;
  packageName?: string | null;
  addons?: Array<{ id: string; title: string; price: string }>;
}

export interface WorkRequestParty {
  id: string;
  displayName: string;
  username: string;
  accountType: string;
  isVerified: boolean;
  avatarUrl: string | null;
  title: string | null;
}

export interface WorkRequestEvent {
  id: string;
  type: WorkRequestEventType;
  actorId: string | null;
  fromStatus: WorkRequestStatus | null;
  toStatus: WorkRequestStatus | null;
  note: string;
  payload: unknown;
  createdAt: string;
}

export interface ApiWorkRequest {
  id: string;
  source: WorkRequestSource;
  status: WorkRequestStatus;
  title: string;
  senderUserId: string;
  recipientUserId: string;
  clientUserId: string;
  providerUserId: string;
  jobListingId: string | null;
  jobApplicationId: string | null;
  serviceOfferingId: string | null;
  serviceTitle: string | null;
  workEngagementId: string | null;
  workEngagementStatus: ApiEngagementStatus | null;
  terms: WorkRequestTerms;
  proposedTerms: WorkRequestTerms | null;
  agreedTerms: WorkRequestTerms | null;
  proposedByUserId: string | null;
  proposalComment: string;
  rejectionComment: string;
  sender: WorkRequestParty;
  recipient: WorkRequestParty;
  direction: 'sent' | 'received' | null;
  counterparty: WorkRequestParty | null;
  unread: boolean;
  events: WorkRequestEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkRequestUnreadSummary {
  sentUnread: number;
  receivedUnread: number;
}

export interface AcceptWorkRequestResult {
  workRequest: ApiWorkRequest;
  engagement: ApiEngagement;
}

export type PackageTier = 'basic' | 'standard' | 'premium';

export interface CreateServiceWorkRequestInput {
  serviceOfferingId: string;
  packageTier?: PackageTier;
  addonIds?: string[];
  notes?: string;
  deadlineLabel?: string;
  price?: string;
}

export interface CreateDirectWorkRequestInput {
  recipientUserId: string;
  title: string;
  scope?: string;
  price?: string;
  currency?: string;
  deadlineLabel?: string;
  message?: string;
}

/** Partial terms a party proposes when asking for changes. */
export interface ProposedTermsInput {
  title?: string;
  scope?: string;
  price?: string;
  currency?: string;
  deadlineLabel?: string;
  notes?: string;
}

/** The effective terms both parties are looking at right now. */
export function effectiveTerms(request: ApiWorkRequest): WorkRequestTerms {
  return request.agreedTerms ?? request.proposedTerms ?? request.terms;
}

export const SOURCE_BADGE_LABEL: Record<WorkRequestSource, string> = {
  job_posting: 'JOB POSTING',
  service_request: 'SERVICE REQUEST',
  direct_request: 'DIRECT REQUEST',
};

export const workRequestApi = {
  listMine(
    direction: 'sent' | 'received',
    status?: WorkRequestStatus,
  ): Promise<ApiWorkRequest[]> {
    const qs = new URLSearchParams({ direction });
    if (status) qs.set('status', status);
    return apiRequest<ApiWorkRequest[]>(
      `/users/me/work-requests?${qs.toString()}`,
    );
  },

  unreadSummary(): Promise<WorkRequestUnreadSummary> {
    return apiRequest<WorkRequestUnreadSummary>(
      '/users/me/work-requests/unread-summary',
    );
  },

  get(id: string): Promise<ApiWorkRequest> {
    return apiRequest<ApiWorkRequest>(`/work-requests/${id}`);
  },

  markViewed(id: string): Promise<ApiWorkRequest> {
    return apiRequest<ApiWorkRequest>(`/work-requests/${id}/view`, {
      method: 'POST',
    });
  },

  accept(id: string): Promise<AcceptWorkRequestResult> {
    return apiRequest<AcceptWorkRequestResult>(
      `/work-requests/${id}/accept`,
      { method: 'POST' },
    );
  },

  requestChanges(
    id: string,
    proposedTerms: ProposedTermsInput,
    comment?: string,
  ): Promise<ApiWorkRequest> {
    return apiRequest<ApiWorkRequest>(`/work-requests/${id}/request-changes`, {
      method: 'POST',
      body: JSON.stringify({ proposedTerms, comment }),
    });
  },

  acceptChanges(id: string): Promise<AcceptWorkRequestResult> {
    return apiRequest<AcceptWorkRequestResult>(
      `/work-requests/${id}/accept-changes`,
      { method: 'POST' },
    );
  },

  declineChanges(id: string, comment?: string): Promise<ApiWorkRequest> {
    return apiRequest<ApiWorkRequest>(`/work-requests/${id}/decline-changes`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  },

  reject(id: string, comment?: string): Promise<ApiWorkRequest> {
    return apiRequest<ApiWorkRequest>(`/work-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  },

  withdraw(id: string, comment?: string): Promise<ApiWorkRequest> {
    return apiRequest<ApiWorkRequest>(`/work-requests/${id}/withdraw`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  },

  createFromService(
    input: CreateServiceWorkRequestInput,
  ): Promise<ApiWorkRequest> {
    return apiRequest<ApiWorkRequest>('/work-requests/service', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  createDirect(input: CreateDirectWorkRequestInput): Promise<ApiWorkRequest> {
    return apiRequest<ApiWorkRequest>('/work-requests/direct', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};
