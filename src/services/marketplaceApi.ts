import { JobListing, User } from '../data/types';
import {
  UserJob,
  UserJobDetails,
  UserJobStatus,
} from '../data/types/userJobs';
import { apiRequest } from '../lib/apiClient';

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

export interface AcceptApplicationResult {
  application: ApiApplication;
  engagement: ApiEngagement;
}

const EMPLOYMENT_TO_UI: Record<
  ApiEmploymentType,
  JobListing['type']
> = {
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

function partyToUser(party: ApiParty): User {
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
  return {
    id: api.id,
    title: api.title,
    company: api.companyName || api.poster.displayName,
    type: EMPLOYMENT_TO_UI[api.employmentType],
    location: api.location,
    salary: api.salaryLabel || 'Negotiable',
    description: api.description,
    skills: api.skills ?? [],
    postedAt: api.postedAt || api.createdAt,
    status: listingStatusToUi(api.status),
    logo: api.poster.avatarUrl ?? undefined,
    exploreTag: api.exploreTag ?? undefined,
  };
}

function applicationStatusToUserJob(
  status: ApiApplicationStatus,
): { status: UserJobStatus; statusLabel: string; section: UserJob['section'] } {
  switch (status) {
    case 'accepted':
      return {
        status: 'in-progress',
        statusLabel: 'Accepted',
        section: 'in-progress',
      };
    case 'rejected':
      return { status: 'declined', statusLabel: 'Rejected', section: 'requests' };
    case 'withdrawn':
      return {
        status: 'declined',
        statusLabel: 'Withdrawn',
        section: 'requests',
      };
    case 'under_review':
      return {
        status: 'pending',
        statusLabel: 'Under Review',
        section: 'requests',
      };
    default:
      return { status: 'pending', statusLabel: 'Pending', section: 'requests' };
  }
}

function engagementStatusToUserJob(
  status: ApiEngagementStatus,
): { status: UserJobStatus; statusLabel: string; section: UserJob['section'] } {
  switch (status) {
    case 'pending_payment':
      return {
        status: 'pending-payment',
        statusLabel: 'Pending Payment',
        section: 'requests',
      };
    case 'in_progress':
      return {
        status: 'in-progress',
        statusLabel: 'In Progress',
        section: 'in-progress',
      };
    case 'delivered':
      return {
        status: 'in-progress',
        statusLabel: 'Delivered',
        section: 'in-progress',
      };
    case 'completed':
      return {
        status: 'completed',
        statusLabel: 'Completed',
        section: 'completed',
      };
    case 'declined':
    case 'cancelled':
      return { status: 'declined', statusLabel: 'Cancelled', section: 'requests' };
    case 'requested':
    case 'accepted':
      return { status: 'pending', statusLabel: 'Pending', section: 'requests' };
    default:
      return { status: 'pending', statusLabel: status, section: 'requests' };
  }
}

function detailsFromEngagement(api: ApiEngagement): UserJobDetails {
  const d = api.detail;
  const addonsRaw = Array.isArray(d?.addons) ? d!.addons : [];
  return {
    serviceName: d?.serviceName || api.title,
    packageName: d?.packageName || '',
    addons: addonsRaw as UserJobDetails['addons'],
    deadline: d?.deadlineLabel || api.dueAt || 'Flexible',
    locationUrl: d?.locationUrl ?? undefined,
    notes: d?.notes || d?.coverLetter || '',
    attachmentName: '',
    attachmentSize: '',
    packagePrice: Number(d?.packagePrice ?? 0),
    currencySymbol: d?.currency === 'SAR' ? '﷼' : d?.currency || '',
    requestedAt: new Date(api.createdAt).toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
  };
}

/** Map an application for the viewer (talent = sent, business owner = received). */
export function mapApplicationToUserJob(
  api: ApiApplication,
  viewerId: string,
): UserJob {
  const mapped = applicationStatusToUserJob(api.status);
  const isApplicant = api.applicantId === viewerId;
  const listing = api.listing;
  const counterpart = isApplicant
    ? partyToUser({
        id: listing?.posterId ?? listing?.poster?.id ?? '',
        displayName: listing?.companyName || listing?.poster?.displayName || 'Business',
        username: listing?.poster?.username || 'business',
        isVerified: listing?.poster?.isVerified ?? false,
        avatarUrl: listing?.poster?.avatarUrl ?? null,
        title: listing?.location ?? null,
      })
    : partyToUser(api.applicant);

  return {
    id: api.id,
    listingId: api.listingId,
    title: listing?.title || 'Application',
    type: isApplicant ? 'sent' : 'received',
    status: mapped.status,
    statusLabel: mapped.statusLabel,
    counterpart,
    date: listing?.salaryLabel || 'Negotiable',
    createdAt: api.createdAt,
    section: mapped.section,
    jobType: listing ? EMPLOYMENT_TO_UI[listing.employmentType] : undefined,
    activityLabel: isApplicant ? 'Applied' : 'Applicant',
    activityValue: mapped.statusLabel,
    details: listing
      ? {
          serviceName: listing.title,
          packageName: EMPLOYMENT_TO_UI[listing.employmentType],
          addons: [],
          deadline: 'Flexible',
          notes: api.coverLetter || listing.description,
          attachmentName: '',
          attachmentSize: '',
          packagePrice: 0,
          currencySymbol: '﷼',
          requestedAt: new Date(api.createdAt).toLocaleString('en-US'),
        }
      : undefined,
  };
}

export function mapEngagementToUserJob(
  api: ApiEngagement,
  viewerId: string,
): UserJob {
  const mapped = engagementStatusToUserJob(api.status);
  const isClient = api.clientId === viewerId;
  return {
    id: api.id,
    listingId: api.listingId ?? undefined,
    title: api.title,
    type: isClient ? 'received' : 'sent',
    status: mapped.status,
    statusLabel: mapped.statusLabel,
    counterpart: partyToUser(isClient ? api.provider : api.client),
    date: api.dueAt || api.updatedAt,
    dueDate: api.dueAt ?? undefined,
    createdAt: api.createdAt,
    section: mapped.section,
    activityLabel: 'Engagement',
    activityValue: mapped.statusLabel,
    details: detailsFromEngagement(api),
  };
}

export function mapListingToPostedUserJob(
  api: ApiJobListing,
  me: User,
): UserJob {
  return {
    id: `listing-${api.id}`,
    listingId: api.id,
    title: api.title,
    type: 'sent',
    status: api.status === 'open' ? 'pending' : api.status === 'in_progress' ? 'in-progress' : api.status === 'completed' ? 'completed' : 'pending',
    statusLabel: api.status.replace('_', ' '),
    counterpart: me,
    date: api.salaryLabel || 'Negotiable',
    createdAt: api.createdAt,
    section: 'posted',
    jobType: EMPLOYMENT_TO_UI[api.employmentType],
    activityLabel: 'Posted',
    activityValue: api.status,
    details: {
      serviceName: api.title,
      packageName: EMPLOYMENT_TO_UI[api.employmentType],
      addons: [],
      deadline: 'Flexible',
      notes: api.description,
      attachmentName: '',
      attachmentSize: '',
      packagePrice: 0,
      currencySymbol: '﷼',
      requestedAt: new Date(api.createdAt).toLocaleString('en-US'),
    },
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

  apply(
    listingId: string,
    coverLetter?: string,
  ): Promise<ApiApplication> {
    return apiRequest<ApiApplication>(
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

  listMyApplications(): Promise<ApiApplication[]> {
    return apiRequest<ApiApplication[]>('/users/me/applications');
  },

  patchApplication(
    id: string,
    status: ApiApplicationStatus,
  ): Promise<ApiApplication | AcceptApplicationResult> {
    return apiRequest<ApiApplication | AcceptApplicationResult>(
      `/applications/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
    );
  },

  listMyEngagements(): Promise<ApiEngagement[]> {
    return apiRequest<ApiEngagement[]>('/users/me/engagements');
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
};
