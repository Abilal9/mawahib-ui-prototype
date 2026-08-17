import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { JobListing, User } from '../data/types';
import {
  UserJob,
  UserJobDetails,
  UserJobSection,
  UserJobStatus,
} from '../data/types/userJobs';
import { ApiError } from '../lib/apiClient';
import { useAuth } from './AuthContext';
import { jobService } from '../services';
import {
  ApiEngagementStatus,
  ApiJobListing,
  employmentTypeToUi,
  marketplaceApi,
} from '../services/marketplaceApi';
import {
  ApiWorkRequest,
  CreateDirectWorkRequestInput,
  CreateServiceWorkRequestInput,
  PackageTier,
  ProposedTermsInput,
  SOURCE_BADGE_LABEL,
  WorkRequestTerms,
  effectiveTerms,
  formatDeadline,
  workRequestApi,
} from '../services/workRequestApi';

export interface CreatePostedJobPayload {
  title: string;
  description?: string;
  location?: string;
  budget?: string;
  jobType?: JobListing['type'];
  skills?: string[];
}

export interface UnreadSummary {
  sent: number;
  received: number;
}

/**
 * Accepting a request parks the engagement at `pending_payment`; nothing in the
 * app may advance it until payments ship.
 */
export const PAYMENTS_UNAVAILABLE_MESSAGE =
  'Payments are not available yet. This request stays in Pending Payment until in-app payments ship.';

interface UserJobsContextValue {
  jobs: UserJob[];
  loading: boolean;
  error: string | null;
  unread: UnreadSummary;
  refresh: () => Promise<void>;
  refreshUnread: () => Promise<void>;
  getJobById: (id: string) => UserJob | undefined;
  /** Applies to a listing and returns the created work request id. */
  applyToListing: (listingId: string) => Promise<string | undefined>;
  createServiceRequest: (
    payload: CreateServiceWorkRequestInput,
  ) => Promise<string>;
  createDirectRequest: (
    payload: CreateDirectWorkRequestInput,
  ) => Promise<string>;
  createPostedJob: (payload: CreatePostedJobPayload) => Promise<string>;
  acceptRequest: (id: string) => Promise<string | undefined>;
  requestChanges: (
    id: string,
    proposedTerms: ProposedTermsInput,
    comment?: string,
  ) => Promise<void>;
  acceptChanges: (id: string) => Promise<string | undefined>;
  declineChanges: (id: string, comment?: string) => Promise<void>;
  /** Recipient Withdraw Change Request (overflow) while proposal is under review. */
  cancelChanges: (id: string) => Promise<void>;
  rejectRequest: (id: string, comment?: string) => Promise<void>;
  /** Sender Cancel Request (withdraw API) while the negotiation is still open. */
  withdrawRequest: (id: string, comment?: string) => Promise<void>;
  markDelivered: (engagementId: string) => Promise<void>;
  markCompleted: (engagementId: string) => Promise<void>;
  markDisputed: (engagementId: string, note: string) => Promise<void>;
  /** Always rejects: money moves in a later phase. */
  markJobPaid: (id: string) => Promise<never>;
  archiveListing: (listingId: string) => Promise<void>;
  reopenListing: (listingId: string) => Promise<void>;
  closeListing: (listingId: string) => Promise<void>;
  deleteListing: (listingId: string) => Promise<void>;
  submitReview: (
    id: string,
    payload: { rating: number; text?: string; images?: string[] },
  ) => void;
}

const UserJobsContext = createContext<UserJobsContextValue | undefined>(
  undefined,
);

export const PACKAGE_TIER_BY_NAME: Record<string, PackageTier> = {
  Basic: 'basic',
  Standard: 'standard',
  Premium: 'premium',
};

function partyToUser(party: ApiWorkRequest['sender']): User {
  return {
    id: party.id,
    name: party.displayName,
    username: party.username,
    avatar: party.avatarUrl ?? '',
    title: party.title ?? undefined,
    isVerified: party.isVerified,
    followers: 0,
    following: 0,
    posts: 0,
  };
}

/** Engagement stages that outrank the request status on the card. */
function engagementStage(
  status: ApiEngagementStatus | null,
): 'in-progress' | 'delivered' | 'disputed' | 'completed' | null {
  switch (status) {
    case 'in_progress':
      return 'in-progress';
    case 'delivered':
      return 'delivered';
    case 'disputed':
      return 'disputed';
    case 'completed':
      return 'completed';
    default:
      return null;
  }
}

function mapStatus(request: ApiWorkRequest): {
  status: UserJobStatus;
  statusLabel: string;
  section: UserJobSection;
} {
  const stage = engagementStage(request.workEngagementStatus);
  if (stage === 'in-progress') {
    return { status: 'in-progress', statusLabel: 'In Progress', section: 'in-progress' };
  }
  if (stage === 'delivered') {
    return { status: 'delivered', statusLabel: 'Delivered', section: 'in-progress' };
  }
  if (stage === 'disputed') {
    return { status: 'disputed', statusLabel: 'Disputed', section: 'in-progress' };
  }
  if (stage === 'completed') {
    return { status: 'completed', statusLabel: 'Completed', section: 'completed' };
  }

  switch (request.status) {
    case 'pending_payment':
      return {
        status: 'pending-payment',
        statusLabel: 'Pending Payment',
        section: 'pending-payment',
      };
    case 'changes_requested':
      return {
        status: 'changes-requested',
        statusLabel: 'Changes Requested',
        section: 'requests',
      };
    case 'changes_declined':
      return {
        status: 'changes-declined',
        statusLabel: 'Changes Declined',
        section: 'requests',
      };
    case 'rejected':
      return { status: 'rejected', statusLabel: 'Rejected', section: 'completed' };
    case 'withdrawn':
      // API status remains `withdrawn`; users always see Cancelled.
      return { status: 'withdrawn', statusLabel: 'Cancelled', section: 'completed' };
    default:
      return { status: 'pending', statusLabel: 'Pending', section: 'requests' };
  }
}

function activityCopy(
  request: ApiWorkRequest,
  direction: 'sent' | 'received',
): string {
  if (request.source === 'job_posting') {
    return direction === 'sent'
      ? 'Applied to Job Posting'
      : 'Application received';
  }
  if (request.source === 'service_request') {
    return direction === 'sent' ? 'Service requested' : 'Service request received';
  }
  return direction === 'sent' ? 'Direct request sent' : 'Direct request received';
}

/** `Aug 12, 2026` — the day the row was created, never a price or a deadline. */
function formatCardDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function detailsFromTerms(
  request: ApiWorkRequest,
  terms: WorkRequestTerms,
): UserJobDetails {
  return {
    serviceName: request.serviceTitle || terms.title || request.title,
    packageName: terms.packageName || terms.packageTier || '',
    addons: (terms.addons ?? []).map((addon) => ({
      name: addon.title,
      price: addon.money?.amount ?? 0,
    })),
    deadline: formatDeadline(terms.deadline),
    notes: terms.notes || terms.scope || '',
    attachmentName: '',
    attachmentSize: '',
    packagePrice: terms.money?.amount ?? 0,
    currencySymbol: terms.money?.currency ?? '',
    requestedAt: new Date(request.createdAt).toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
  };
}

/** A work request card. `id` is always the work request id. */
export function mapWorkRequestToUserJob(
  request: ApiWorkRequest,
  viewerId: string,
): UserJob {
  const direction =
    request.direction ??
    (request.senderUserId === viewerId ? 'sent' : 'received');
  const mapped = mapStatus(request);
  const terms = effectiveTerms(request);
  const counterparty =
    request.counterparty ??
    (direction === 'sent' ? request.recipient : request.sender);

  return {
    id: request.id,
    requestId: request.id,
    engagementId: request.workEngagementId ?? undefined,
    listingId: request.jobListingId ?? undefined,
    source: request.source,
    sourceLabel: SOURCE_BADGE_LABEL[request.source],
    title: terms.title || request.title,
    type: direction,
    status: mapped.status,
    statusLabel: mapped.statusLabel,
    section: mapped.section,
    counterpart: partyToUser(counterparty),
    date: formatCardDate(request.createdAt),
    createdAt: request.createdAt,
    jobType: terms.employmentType ?? undefined,
    unread: request.unread,
    activityLabel: 'Activity',
    activityValue: activityCopy(request, direction),
    details: detailsFromTerms(request, terms),
  };
}

/** A listing the viewer posted — lives in Sent → Posted Jobs. */
export function mapListingToPostedUserJob(
  listing: ApiJobListing,
  me: User,
): UserJob {
  return {
    id: `listing-${listing.id}`,
    listingId: listing.id,
    source: 'posted_listing',
    sourceLabel: 'POSTED JOB',
    title: listing.title,
    type: 'sent',
    status: 'posted',
    statusLabel: listing.status.replace(/_/g, ' '),
    section: 'posted',
    counterpart: me,
    date: formatCardDate(listing.createdAt),
    createdAt: listing.createdAt,
    jobType: employmentTypeToUi(listing.employmentType),
    activityLabel: 'Posted',
    activityValue: listing.status.replace(/_/g, ' '),
  };
}

export function UserJobsProvider({ children }: { children: React.ReactNode }) {
  const { mappedUser, apiUser, isSignedIn } = useAuth();
  const [jobs, setJobs] = useState<UserJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unread, setUnread] = useState<UnreadSummary>({ sent: 0, received: 0 });

  const refreshUnread = useCallback(async () => {
    if (!isSignedIn || !apiUser) {
      setUnread({ sent: 0, received: 0 });
      return;
    }
    try {
      const summary = await workRequestApi.unreadSummary();
      setUnread({
        sent: summary.sentUnread,
        received: summary.receivedUnread,
      });
    } catch {
      // Badge counts are cosmetic; a failed poll should not surface an error.
    }
  }, [apiUser, isSignedIn]);

  const refresh = useCallback(async () => {
    if (!isSignedIn || !apiUser || !mappedUser) {
      setJobs([]);
      setUnread({ sent: 0, received: 0 });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [sent, received, myListings] = await Promise.all([
        workRequestApi.listMine('sent'),
        workRequestApi.listMine('received'),
        // Posted listings are a side panel; losing them must not empty the inbox.
        marketplaceApi.listMyListings().catch(() => [] as ApiJobListing[]),
      ]);

      const requests = [...sent, ...received].map((request) =>
        mapWorkRequestToUserJob(request, apiUser.id),
      );
      const posted = myListings.map((listing) =>
        mapListingToPostedUserJob(listing, mappedUser),
      );

      setJobs(
        [...requests, ...posted].sort(
          (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
        ),
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load your jobs');
      setJobs([]);
    } finally {
      setLoading(false);
    }
    await refreshUnread();
  }, [apiUser, isSignedIn, mappedUser, refreshUnread]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<UserJobsContextValue>(
    () => ({
      jobs,
      loading,
      error,
      unread,
      refresh,
      refreshUnread,
      getJobById: (id) =>
        jobs.find((j) => j.id === id || j.requestId === id),
      applyToListing: async (listingId) => {
        const existing = jobs.find(
          (j) =>
            j.listingId === listingId &&
            j.type === 'sent' &&
            j.source === 'job_posting',
        );
        if (existing) return existing.id;
        const result = await marketplaceApi.apply(listingId);
        await refresh();
        return result.workRequest.id;
      },
      createServiceRequest: async (payload) => {
        const created = await workRequestApi.createFromService(payload);
        await refresh();
        return created.id;
      },
      createDirectRequest: async (payload) => {
        const created = await workRequestApi.createDirect(payload);
        await refresh();
        return created.id;
      },
      createPostedJob: async (payload) => {
        const me = mappedUser;
        if (!me) throw new Error('Not authenticated');
        const listing = await jobService.createListing({
          title: payload.title.trim() || 'Untitled job',
          company: me.name,
          type: payload.jobType ?? 'freelance',
          location: payload.location?.trim() || me.location || 'Remote',
          salary: payload.budget?.trim() || 'Negotiable',
          description: payload.description?.trim() || 'Job posted from Mawahib.',
          skills: payload.skills ?? [],
          exploreTag: 'Design',
          publish: true,
        });
        await refresh();
        return listing.id;
      },
      acceptRequest: async (id) => {
        const result = await workRequestApi.accept(id);
        await refresh();
        return result.engagement.id;
      },
      requestChanges: async (id, proposedTerms, comment) => {
        await workRequestApi.requestChanges(id, proposedTerms, comment);
        await refresh();
      },
      acceptChanges: async (id) => {
        const result = await workRequestApi.acceptChanges(id);
        await refresh();
        return result.engagement.id;
      },
      declineChanges: async (id, comment) => {
        await workRequestApi.declineChanges(id, comment);
        await refresh();
      },
      cancelChanges: async (id) => {
        await workRequestApi.cancelChanges(id);
        await refresh();
      },
      rejectRequest: async (id, comment) => {
        await workRequestApi.reject(id, comment);
        await refresh();
      },
      withdrawRequest: async (id, comment) => {
        await workRequestApi.withdraw(id, comment);
        await refresh();
      },
      markDelivered: async (engagementId) => {
        await marketplaceApi.transitionEngagement(engagementId, 'delivered');
        await refresh();
      },
      markCompleted: async (engagementId) => {
        await marketplaceApi.transitionEngagement(engagementId, 'completed');
        await refresh();
      },
      markDisputed: async (engagementId, note) => {
        await marketplaceApi.transitionEngagement(engagementId, 'disputed', note);
        await refresh();
      },
      markJobPaid: () => Promise.reject(new Error(PAYMENTS_UNAVAILABLE_MESSAGE)),
      archiveListing: async (listingId) => {
        await marketplaceApi.transitionListing(listingId, 'archived');
        await refresh();
      },
      reopenListing: async (listingId) => {
        await marketplaceApi.transitionListing(listingId, 'open');
        await refresh();
      },
      closeListing: async (listingId) => {
        await marketplaceApi.transitionListing(listingId, 'closed');
        await refresh();
      },
      deleteListing: async (listingId) => {
        await marketplaceApi.deleteListing(listingId);
        await refresh();
      },
      submitReview: () => {
        // Reviews are a later phase — callers must not treat this as success.
        throw new Error(
          'Reviews are not available yet. They will ship in a later phase.',
        );
      },
    }),
    [jobs, loading, error, unread, refresh, refreshUnread, mappedUser],
  );

  return (
    <UserJobsContext.Provider value={value}>{children}</UserJobsContext.Provider>
  );
}

export function useUserJobs() {
  const ctx = useContext(UserJobsContext);
  if (!ctx) throw new Error('useUserJobs must be used within UserJobsProvider');
  return ctx;
}
