import { JobListing } from '../data/types';
import { apiRequest } from '../lib/apiClient';
import type { ApiWorkRequest } from './workRequestApi';

export type ApiEmploymentType =
  | 'full_time'
  | 'part_time'
  | 'contract'
  | 'freelance'
  | 'gig';

export type ApiJobListingStatus =
  | 'draft'
  | 'open'
  | 'archived'
  | 'closed'
  | 'in_progress'
  | 'completed'
  | 'expired';

export type ApiApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export type ApiEngagementStatus =
  | 'requested'
  | 'accepted'
  | 'declined'
  | 'cancelled'
  | 'pending_payment'
  | 'payment_failed'
  | 'in_progress'
  | 'delivered'
  | 'disputed'
  | 'completed';

export interface ApiPoster {
  id: string;
  displayName: string;
  username: string;
  accountType: string;
  isVerified: boolean;
  avatarUrl: string | null;
}

export interface ApiJobListing {
  id: string;
  posterId: string;
  title: string;
  companyName: string | null;
  employmentType: ApiEmploymentType;
  location: string;
  salaryLabel: string | null;
  /** Snapshotted poster default currency at create time. */
  currency: string;
  description: string;
  skills: string[];
  exploreTag: string | null;
  status: ApiJobListingStatus;
  postedAt: string | null;
  createdAt: string;
  updatedAt: string;
  poster: ApiPoster;
}

export interface ApiJobListingsPage {
  items: ApiJobListing[];
  total: number;
  take: number;
  skip: number;
}

export interface ApiParty {
  id: string;
  displayName: string;
  username: string;
  isVerified: boolean;
  avatarUrl: string | null;
  title: string | null;
  accountType?: string;
}

export interface ApiApplication {
  id: string;
  listingId: string;
  applicantId: string;
  coverLetter: string;
  status: ApiApplicationStatus;
  createdAt: string;
  updatedAt: string;
  applicant: ApiParty;
  listing: ApiJobListing | null;
}

export interface ApiEngagementDetail {
  serviceName: string;
  packageName: string;
  packagePrice: string;
  currency: string;
  addons: unknown;
  deadlineLabel: string | null;
  locationUrl: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  notes: string;
  coverLetter: string;
}

export interface ApiEngagement {
  id: string;
  listingId: string | null;
  applicationId: string | null;
  serviceOfferingId: string | null;
  clientId: string;
  providerId: string;
  title: string;
  status: ApiEngagementStatus;
  source: string;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
  client: ApiParty;
  provider: ApiParty;
  detail: ApiEngagementDetail | null;
  events: Array<{
    id: string;
    fromStatus: ApiEngagementStatus | null;
    toStatus: ApiEngagementStatus;
    actorId: string | null;
    note: string;
    createdAt: string;
  }>;
}

/** Applying creates the application *and* the work request that carries it. */
export interface ApplyToListingResult {
  application: ApiApplication;
  workRequest: ApiWorkRequest;
}

export interface ApiEngagementReview {
  id: string;
  engagementId: string;
  reviewerId: string;
  rating: number;
  body: string;
  createdAt: string;
}

export interface CreateEngagementReviewResult {
  review: ApiEngagementReview;
  conversationId?: string | null;
}

const EMPLOYMENT_TO_UI: Record<ApiEmploymentType, JobListing['type']> = {
  full_time: 'full-time',
  part_time: 'part-time',
  contract: 'contract',
  freelance: 'freelance',
  gig: 'gig',
};

const EMPLOYMENT_TO_API: Record<JobListing['type'], ApiEmploymentType> = {
  'full-time': 'full_time',
  'part-time': 'part_time',
  contract: 'contract',
  freelance: 'freelance',
  gig: 'gig',
};

export function employmentTypeToUi(
  type: ApiEmploymentType,
): JobListing['type'] {
  return EMPLOYMENT_TO_UI[type];
}

function listingStatusToUi(
  status: ApiJobListingStatus,
): NonNullable<JobListing['status']> {
  switch (status) {
    case 'in_progress':
      return 'in-progress';
    case 'completed':
      return 'completed';
    case 'closed':
    case 'archived':
    case 'expired':
      return 'cancelled';
    default:
      return 'open';
  }
}

export function mapApiListingToJob(api: ApiJobListing): JobListing {
  const currency =
    api.currency === 'AED' || api.currency === 'SAR' ? api.currency : null;
  return {
    id: api.id,
    title: api.title,
    company: api.companyName || api.poster.displayName,
    type: EMPLOYMENT_TO_UI[api.employmentType],
    location: api.location,
    salary: api.salaryLabel || 'Negotiable',
    currency,
    description: api.description,
    skills: api.skills ?? [],
    postedAt: api.postedAt || api.createdAt,
    status: listingStatusToUi(api.status),
    logo: api.poster.avatarUrl ?? undefined,
    exploreTag: api.exploreTag ?? undefined,
  };
}

export const marketplaceApi = {
  listOpenListings(params?: {
    q?: string;
    exploreTag?: string;
    take?: number;
    skip?: number;
  }): Promise<ApiJobListingsPage> {
    const qs = new URLSearchParams();
    qs.set('status', 'open');
    if (params?.q) qs.set('q', params.q);
    if (params?.exploreTag) qs.set('exploreTag', params.exploreTag);
    if (params?.take != null) qs.set('take', String(params.take));
    if (params?.skip != null) qs.set('skip', String(params.skip));
    return apiRequest<ApiJobListingsPage>(`/job-listings?${qs.toString()}`);
  },

  getListing(id: string): Promise<ApiJobListing> {
    return apiRequest<ApiJobListing>(`/job-listings/${id}`);
  },

  /** Listings the viewer posted — any account type may post. */
  listMyListings(): Promise<ApiJobListing[]> {
    return apiRequest<ApiJobListing[]>('/users/me/job-listings');
  },

  createListing(input: {
    title: string;
    companyName?: string;
    employmentType: JobListing['type'];
    location: string;
    salaryLabel?: string;
    description?: string;
    skills?: string[];
    exploreTag?: string;
    publish?: boolean;
  }): Promise<ApiJobListing> {
    return apiRequest<ApiJobListing>('/job-listings', {
      method: 'POST',
      body: JSON.stringify({
        title: input.title,
        companyName: input.companyName,
        employmentType: EMPLOYMENT_TO_API[input.employmentType],
        location: input.location,
        salaryLabel: input.salaryLabel,
        description: input.description,
        skills: input.skills,
        exploreTag: input.exploreTag,
        publish: input.publish ?? true,
      }),
    });
  },

  updateListing(
    id: string,
    input: Partial<{
      title: string;
      companyName: string | null;
      employmentType: JobListing['type'];
      location: string;
      salaryLabel: string | null;
      description: string;
      skills: string[];
      exploreTag: string | null;
    }>,
  ): Promise<ApiJobListing> {
    return apiRequest<ApiJobListing>(`/job-listings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...input,
        employmentType: input.employmentType
          ? EMPLOYMENT_TO_API[input.employmentType]
          : undefined,
      }),
    });
  },

  transitionListing(
    id: string,
    status: 'open' | 'archived' | 'closed',
  ): Promise<ApiJobListing> {
    return apiRequest<ApiJobListing>(`/job-listings/${id}/transitions`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },

  deleteListing(id: string): Promise<void> {
    return apiRequest<void>(`/job-listings/${id}`, {
      method: 'DELETE',
    });
  },

  apply(listingId: string, coverLetter?: string): Promise<ApplyToListingResult> {
    return apiRequest<ApplyToListingResult>(
      `/job-listings/${listingId}/applications`,
      {
        method: 'POST',
        body: JSON.stringify({ coverLetter: coverLetter ?? '' }),
      },
    );
  },

  listApplicationsForListing(listingId: string): Promise<ApiApplication[]> {
    return apiRequest<ApiApplication[]>(
      `/job-listings/${listingId}/applications`,
    );
  },

  getEngagement(id: string): Promise<ApiEngagement> {
    return apiRequest<ApiEngagement>(`/engagements/${id}`);
  },

  transitionEngagement(
    id: string,
    status: ApiEngagementStatus,
    note?: string,
  ): Promise<ApiEngagement> {
    return apiRequest<ApiEngagement>(`/engagements/${id}/transitions`, {
      method: 'POST',
      body: JSON.stringify({ status, note }),
    });
  },

  /**
   * DEV-ONLY: skip pending_payment → in_progress without Phase 5 payments.
   * Requires backend ENABLE_DEV_START_WORK=true and non-production NODE_ENV.
   */
  devStartWork(engagementId: string): Promise<ApiEngagement> {
    return apiRequest<ApiEngagement>(
      `/engagements/${engagementId}/dev-start-work`,
      { method: 'POST' },
    );
  },

  createEngagementReview(
    engagementId: string,
    input: { rating: number; body?: string },
  ): Promise<CreateEngagementReviewResult> {
    return apiRequest<CreateEngagementReviewResult>(
      `/engagements/${engagementId}/reviews`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
  },
};
