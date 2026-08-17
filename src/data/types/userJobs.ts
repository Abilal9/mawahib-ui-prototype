import { User } from './index';

/**
 * Card-level status for a work request (or a listing the viewer posted).
 * Mirrors the backend work-request status plus the engagement stages that
 * follow acceptance.
 */
export type UserJobStatus =
  | 'pending'
  | 'changes-requested'
  | 'changes-declined'
  | 'pending-payment'
  | 'in-progress'
  | 'delivered'
  | 'disputed'
  | 'completed'
  | 'rejected'
  | 'withdrawn'
  | 'posted';

/** Statuses that belong in the History (archive) Jobs section. */
export const COMPLETED_USER_JOB_STATUSES: UserJobStatus[] = [
  'completed',
  'rejected',
  'withdrawn',
];

export function isCompletedStatus(status: UserJobStatus): boolean {
  return COMPLETED_USER_JOB_STATUSES.includes(status);
}

/** Where the row came from — drives the small uppercase badge on cards. */
export type UserJobSource =
  | 'job_posting'
  | 'service_request'
  | 'direct_request'
  | 'posted_listing';

export type UserJobSection =
  | 'requests'
  | 'pending-payment'
  | 'in-progress'
  | 'completed'
  | 'posted';

export interface UserJobAddon {
  name: string;
  price: number;
}

export interface UserJobDetails {
  serviceName: string;
  packageName: string;
  addons: UserJobAddon[];
  deadline: string;
  locationUrl?: string;
  notes: string;
  attachmentName: string;
  attachmentSize: string;
  packagePrice: number;
  currencySymbol: string;
  requestedAt: string;
}

export interface UserJob {
  /** Work request id for requests, `listing-{uuid}` for posted listings. */
  id: string;
  /** Set on every work request row; never a listing/application/engagement id. */
  requestId?: string;
  /** Set once the request has been accepted into an engagement. */
  engagementId?: string;
  /** Source job listing, when the row is linked to one. */
  listingId?: string;
  source: UserJobSource;
  title: string;
  type: 'received' | 'sent';
  status: UserJobStatus;
  statusLabel: string;
  /** Uppercase pill copy, e.g. JOB POSTING */
  sourceLabel: string;
  counterpart: User;
  date: string;
  createdAt: string;
  dueDate?: string;
  jobType?: string;
  unread?: boolean;
  section: UserJobSection;
  activityLabel?: string;
  activityValue?: string;
  details?: UserJobDetails;
  /** Set after the user submits a job review */
  rating?: number;
  reviewText?: string;
  reviewImages?: string[];
}

/**
 * A work request created by applying to a listing — a UserJob with
 * source `job_posting`.
 */
export type JobApplication = UserJob;

/**
 * Detail fields for a card, with empty placeholders where the backend has
 * nothing yet. Never invents packages, add-ons or attachments.
 */
export function resolveJobDetails(job: UserJob): UserJobDetails {
  if (job.details) return job.details;
  return {
    serviceName: job.title,
    packageName: '',
    addons: [],
    deadline: job.dueDate ?? '',
    notes: '',
    attachmentName: '',
    attachmentSize: '',
    packagePrice: 0,
    currencySymbol: '',
    requestedAt: job.createdAt,
  };
}

export function jobTotalPrice(details: UserJobDetails): number {
  const addons = details.addons.reduce((sum, a) => sum + a.price, 0);
  return details.packagePrice + addons;
}

export function formatMoney(amount: number): string {
  return amount.toLocaleString('en-US');
}
