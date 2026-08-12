import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { User, JobListing } from '../data/types';
import { UserJob, UserJobAddon, UserJobDetails } from '../data/types/userJobs';
import { ApiError } from '../lib/apiClient';
import { useAuth } from './AuthContext';
import { jobService } from '../services';
import {
  AcceptApplicationResult,
  ApiApplication,
  ApiEngagement,
  mapApplicationToUserJob,
  mapEngagementToUserJob,
  mapListingToPostedUserJob,
  marketplaceApi,
} from '../services/marketplaceApi';

interface RequestEditsPayload {
  date: string;
  packagePrice: string;
  notes?: string;
}

interface SubmitReviewPayload {
  rating: number;
  text?: string;
  images?: string[];
}

export interface CreateServiceRequestPayload {
  provider: User;
  serviceName: string;
  packageName: string;
  packagePrice: number;
  addons: UserJobAddon[];
  deadline?: string;
  dateLabel?: string;
  locationUrl?: string;
  country?: string;
  city?: string;
  locationDetails?: string;
  notes?: string;
  attachmentName?: string;
  attachmentSize?: string;
}

export interface CreatePostedJobPayload {
  title: string;
  description?: string;
  location?: string;
  budget?: string;
  jobType?: JobListing['type'];
  skills?: string[];
}

interface UserJobsContextValue {
  jobs: UserJob[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getJobById: (id: string) => UserJob | undefined;
  applyToListing: (listingId: string) => Promise<string | undefined>;
  /** @deprecated Use applyToListing */
  openFromListing: (listingId: string) => Promise<string | undefined>;
  createServiceRequest: (payload: CreateServiceRequestPayload) => never;
  createPostedJob: (payload: CreatePostedJobPayload) => Promise<string>;
  acceptJob: (id: string) => Promise<string | undefined>;
  declineJob: (id: string, reason?: string) => Promise<void>;
  requestEdits: (id: string, payload: RequestEditsPayload) => void;
  markJobPaid: (id: string) => Promise<void>;
  markJobCompleted: (id: string) => Promise<void>;
  acceptAfterReview: (id: string) => void;
  submitReview: (id: string, payload: SubmitReviewPayload) => void;
  withdrawApplication: (id: string) => Promise<void>;
}

const UserJobsContext = createContext<UserJobsContextValue | undefined>(
  undefined,
);

function isAcceptResult(
  value: ApiApplication | AcceptApplicationResult,
): value is AcceptApplicationResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'engagement' in value &&
    'application' in value
  );
}

function mergeMarketplaceRows(
  viewerId: string,
  me: User,
  applications: ApiApplication[],
  engagements: ApiEngagement[],
  myListings: Awaited<ReturnType<typeof marketplaceApi.listMyListings>>,
): UserJob[] {
  const engagementAppIds = new Set(
    engagements
      .map((e) => e.applicationId)
      .filter((id): id is string => Boolean(id)),
  );

  const fromApps = applications
    .filter((app) => !engagementAppIds.has(app.id))
    .map((app) => mapApplicationToUserJob(app, viewerId));

  const fromEngagements = engagements.map((eng) =>
    mapEngagementToUserJob(eng, viewerId),
  );

  const fromListings = myListings.map((listing) =>
    mapListingToPostedUserJob(listing, me),
  );

  return [...fromEngagements, ...fromApps, ...fromListings].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export function UserJobsProvider({ children }: { children: React.ReactNode }) {
  const { mappedUser, apiUser, isSignedIn } = useAuth();
  const [jobs, setJobs] = useState<UserJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isSignedIn || !apiUser || !mappedUser) {
      setJobs([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const viewerId = apiUser.id;
      const isBusiness = apiUser.accountType === 'business';

      const [myApplications, myEngagements, myListings] = await Promise.all([
        marketplaceApi.listMyApplications(),
        marketplaceApi.listMyEngagements(),
        isBusiness
          ? marketplaceApi.listMyListings()
          : Promise.resolve([] as Awaited<
              ReturnType<typeof marketplaceApi.listMyListings>
            >),
      ]);

      let ownerApplications: ApiApplication[] = [];
      if (isBusiness && myListings.length > 0) {
        const nested = await Promise.all(
          myListings.map((listing) =>
            marketplaceApi.listApplicationsForListing(listing.id).catch(() => []),
          ),
        );
        ownerApplications = nested.flat();
      }

      const allApps = [...myApplications, ...ownerApplications];
      const byId = new Map(allApps.map((a) => [a.id, a]));
      const applications = Array.from(byId.values());

      setJobs(
        mergeMarketplaceRows(
          viewerId,
          mappedUser,
          applications,
          myEngagements,
          myListings,
        ),
      );
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : 'Failed to load marketplace data',
      );
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [apiUser, isSignedIn, mappedUser]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<UserJobsContextValue>(
    () => ({
      jobs,
      loading,
      error,
      refresh,
      getJobById: (id) =>
        jobs.find((j) => j.id === id || j.listingId === id),
      applyToListing: async (listingId) => {
        const existing = jobs.find(
          (j) =>
            (j.listingId === listingId || j.id === listingId) &&
            j.type === 'sent' &&
            j.status === 'pending',
        );
        if (existing) return existing.id;
        const created = await marketplaceApi.apply(listingId);
        await refresh();
        return created.id;
      },
      openFromListing: async (listingId) => {
        const existing = jobs.find(
          (j) =>
            (j.listingId === listingId || j.id === listingId) &&
            j.type === 'sent',
        );
        if (existing) return existing.id;
        const created = await marketplaceApi.apply(listingId);
        await refresh();
        return created.id;
      },
      createServiceRequest: (_payload) => {
        throw new Error(
          'Direct service requests are not available yet. Use job listings and applications.',
        );
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
          description:
            payload.description?.trim() || 'Job posted from Mawahib.',
          skills: payload.skills ?? [],
          exploreTag: 'Design',
          publish: true,
        });
        await refresh();
        return `listing-${listing.id}`;
      },
      acceptJob: async (id) => {
        const result = await marketplaceApi.patchApplication(id, 'accepted');
        await refresh();
        if (isAcceptResult(result)) return result.engagement.id;
        return id;
      },
      declineJob: async (id) => {
        const job = jobs.find((j) => j.id === id);
        if (job?.section === 'posted' && job.listingId) {
          await marketplaceApi.transitionListing(job.listingId, 'closed');
        } else if (job?.type === 'received' && job.status === 'pending') {
          await marketplaceApi.patchApplication(id, 'rejected');
        } else {
          await marketplaceApi.transitionEngagement(id, 'declined');
        }
        await refresh();
      },
      requestEdits: () => {
        // Edit-request flow remains UI-only until messaging/payments phases.
      },
      markJobPaid: async (id) => {
        await marketplaceApi.transitionEngagement(id, 'in_progress');
        await refresh();
      },
      markJobCompleted: async (id) => {
        const eng = await marketplaceApi.getEngagement(id);
        if (eng.status === 'in_progress') {
          await marketplaceApi.transitionEngagement(id, 'delivered');
        }
        const latest = await marketplaceApi.getEngagement(id);
        if (latest.status === 'delivered') {
          await marketplaceApi.transitionEngagement(id, 'completed');
        }
        await refresh();
      },
      acceptAfterReview: () => {
        // Deferred with payments.
      },
      submitReview: () => {
        // Reviews are a later phase.
      },
      withdrawApplication: async (id) => {
        await marketplaceApi.patchApplication(id, 'withdrawn');
        await refresh();
      },
    }),
    [jobs, loading, error, refresh, mappedUser],
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
