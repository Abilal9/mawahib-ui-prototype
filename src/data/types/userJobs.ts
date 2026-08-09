import { User } from './index';

/**
 * In-app work engagement statuses.
 *
 * Terminal success: prefer `completed` for both sent & received.
 * `done` is treated as an alias of `completed` (seed data / filters accept both).
 * `sent` is a legacy label; prefer statusLabel + type for display.
 */
export type UserJobStatus =
  | 'pending'
  | 'sent-for-review'
  | 'pending-payment'
  | 'in-progress'
  | 'upcoming'
  | 'done'
  | 'completed'
  | 'declined'
  | 'sent';

/** Statuses that mean the engagement finished successfully */
export const COMPLETED_USER_JOB_STATUSES: UserJobStatus[] = ['done', 'completed'];

export function isCompletedStatus(status: UserJobStatus): boolean {
  return status === 'done' || status === 'completed';
}

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
  id: string;
  /** When created from an explore/home listing */
  listingId?: string;
  title: string;
  type: 'received' | 'sent';
  status: UserJobStatus;
  statusLabel: string;
  counterpart: User;
  date: string;
  createdAt: string;
  dueDate?: string;
  jobType?: string;
  section?:
    | 'requests'
    | 'in-progress'
    | 'upcoming'
    | 'completed'
    | 'posted'
    | 'history';
  activityLabel?: string;
  activityValue?: string;
  details?: UserJobDetails;
  /** Set after the user submits a job review */
  rating?: number;
  reviewText?: string;
  reviewImages?: string[];
}

/**
 * Application to a JobListing — UserJob with type:'sent' and status:'pending'
 * (or later statuses as the lifecycle advances).
 */
export type JobApplication = UserJob;

/** Fill in missing detail fields for the request detail screen */
export function resolveJobDetails(job: UserJob): UserJobDetails {
  if (job.details) return job.details;
  return {
    serviceName: job.title,
    packageName: 'Standard',
    addons: [
      { name: 'Export to Dev-ready Format', price: 300 },
      { name: 'Design System Kit', price: 300 },
    ],
    deadline: job.dueDate ?? '05/14/2025',
    locationUrl: 'https://share.google/V0pPts7OTNOeU4EqG',
    notes:
      'Please deliver according to the brief. Include source files and a short walkthrough of key screens.',
    attachmentName: 'Brief.pdf',
    attachmentSize: '1.2 MB',
    packagePrice: 1000,
    currencySymbol: '﷼',
    requestedAt: '1 Jan 2024, 2:30 PM',
  };
}

export function jobTotalPrice(details: UserJobDetails): number {
  const addons = details.addons.reduce((sum, a) => sum + a.price, 0);
  return details.packagePrice + addons;
}

export function formatMoney(amount: number): string {
  return amount.toLocaleString('en-US');
}
