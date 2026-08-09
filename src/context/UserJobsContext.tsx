import React, { createContext, useContext, useMemo, useState } from 'react';
import { userJobs as seedJobs } from '../data/mock/userJobs';
import { getJobById as getListingById } from '../data/mock/jobs';
import { users } from '../data/mock/users';
import { User, Job } from '../data/types';
import { UserJob, UserJobAddon, UserJobDetails } from '../data/types/userJobs';

/**
 * In-memory jobs store for the prototype.
 * Seeds mock user-jobs and exposes helpers to open listing-based requests,
 * create visitor service requests (pending, no payment), and advance job status.
 */

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
  notes?: string;
  attachmentName?: string;
  attachmentSize?: string;
}

interface UserJobsContextValue {
  jobs: UserJob[];
  getJobById: (id: string) => UserJob | undefined;
  /**
   * Apply to an explore/home job listing as the provider (sent / pending application).
   * Reuses an existing application for the same listing when present.
   */
  applyToListing: (listingId: string) => string | undefined;
  /** @deprecated Use applyToListing — kept briefly for any stale call sites */
  openFromListing: (listingId: string) => string | undefined;
  /** Client applies to a provider service — pending until provider accepts (then pending-payment) */
  createServiceRequest: (payload: CreateServiceRequestPayload) => string;
  acceptJob: (id: string) => void;
  declineJob: (id: string, reason?: string) => void;
  requestEdits: (id: string, payload: RequestEditsPayload) => void;
  /** After client pays a pending-payment job → moves to in-progress */
  markJobPaid: (id: string) => void;
  submitReview: (id: string, payload: SubmitReviewPayload) => void;
}

const UserJobsContext = createContext<UserJobsContextValue | undefined>(undefined);

function nowIso() {
  return new Date().toISOString();
}

function detailsFromListing(listing: Job): UserJobDetails {
  return {
    serviceName: listing.title,
    packageName: listing.type.replace('-', ' '),
    addons: [],
    deadline: '05/14/2025',
    locationUrl: undefined,
    notes: listing.description,
    attachmentName: 'Job-brief.pdf',
    attachmentSize: '800 KB',
    packagePrice: 1000,
    currencySymbol: '﷼',
    requestedAt: new Date().toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
  };
}

/** Provider applying to a posted job → sent pending application (not a received request). */
function applicationFromListing(listing: Job): UserJob {
  return {
    id: `uj-apply-${listing.id}`,
    listingId: listing.id,
    title: listing.title,
    type: 'sent',
    status: 'pending',
    statusLabel: 'Pending',
    counterpart: {
      ...users[1],
      id: `listing-${listing.id}`,
      name: listing.company,
      avatar: listing.logo ?? users[1].avatar,
      title: listing.location,
    },
    date: listing.salary,
    createdAt: nowIso(),
    section: 'requests',
    activityLabel: 'Applied',
    activityValue: 'Just Now',
    details: detailsFromListing(listing),
  };
}

function applyToListingId(
  jobs: UserJob[],
  listingId: string,
  setJobs: React.Dispatch<React.SetStateAction<UserJob[]>>
): string | undefined {
  const existing = jobs.find(
    (j) => (j.listingId === listingId || j.id === listingId) && j.type === 'sent'
  );
  if (existing) return existing.id;

  const listing = getListingById(listingId);
  if (!listing) return undefined;

  const created = applicationFromListing(listing);
  setJobs((prev) => [created, ...prev]);
  return created.id;
}

export function UserJobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<UserJob[]>(seedJobs);

  const value = useMemo<UserJobsContextValue>(
    () => ({
      jobs,
      getJobById: (id) =>
        jobs.find((j) => j.id === id || j.listingId === id),
      applyToListing: (listingId) => applyToListingId(jobs, listingId, setJobs),
      openFromListing: (listingId) => applyToListingId(jobs, listingId, setJobs),
      /**
       * Client → provider Apply path: insert a `sent` / `pending` request (not pending-payment).
       * Currency glyph left empty so UI can render location-aware CurrencyIcon instead.
       * Returns the new user-job id for optional navigation.
       */
      createServiceRequest: (payload) => {
        const id = `uj-req-${Date.now()}`;
        const deadline = payload.deadline?.trim() || undefined;
        const dateLabel =
          payload.dateLabel?.trim() || deadline || 'Flexible';
        const created: UserJob = {
          id,
          title: payload.serviceName,
          type: 'sent',
          status: 'pending',
          statusLabel: 'Pending',
          counterpart: payload.provider,
          date: dateLabel,
          dueDate: deadline,
          createdAt: nowIso(),
          section: 'requests',
          activityLabel: 'Requested',
          activityValue: 'Just Now',
          details: {
            serviceName: payload.serviceName,
            packageName: payload.packageName,
            addons: payload.addons,
            deadline: deadline ?? 'Flexible',
            locationUrl: payload.locationUrl?.trim() || undefined,
            notes: payload.notes?.trim() || '',
            attachmentName: payload.attachmentName?.trim() || '',
            attachmentSize: payload.attachmentSize?.trim() || '',
            packagePrice: payload.packagePrice,
            // Intentionally blank — screens use CurrencyIcon from location.
            currencySymbol: '',
            requestedAt: new Date().toLocaleString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            }),
          },
        };
        setJobs((prev) => [created, ...prev]);
        return id;
      },
      acceptJob: (id) => {
        setJobs((prev) =>
          prev.map((job) =>
            job.id === id
              ? {
                  ...job,
                  status: 'pending-payment',
                  statusLabel: 'Pending Payment',
                  section: 'requests',
                  createdAt: nowIso(),
                  activityLabel: 'Requested',
                  activityValue: 'Just Now',
                }
              : job
          )
        );
      },
      markJobPaid: (id) => {
        setJobs((prev) =>
          prev.map((job) =>
            job.id === id
              ? {
                  ...job,
                  status: 'in-progress',
                  statusLabel: 'In Progress',
                  section: 'in-progress',
                  createdAt: nowIso(),
                  activityLabel: 'Due Date',
                  activityValue: job.dueDate || job.date || 'TBD',
                }
              : job
          )
        );
      },
      declineJob: (id, reason) => {
        setJobs((prev) =>
          prev.map((job) =>
            job.id === id
              ? {
                  ...job,
                  status: 'declined',
                  statusLabel: 'Declined',
                  section: 'requests',
                  createdAt: nowIso(),
                  activityLabel: 'Declined',
                  activityValue: reason?.trim() ? 'With reason' : 'No reason',
                }
              : job
          )
        );
      },
      requestEdits: (id, payload) => {
        setJobs((prev) =>
          prev.map((job) => {
            if (job.id !== id) return job;
            const priceDigits = payload.packagePrice.replace(/[^\d]/g, '');
            const nextPrice = priceDigits ? Number(priceDigits) : undefined;
            const baseDetails = job.details;
            return {
              ...job,
              status: 'sent-for-review',
              statusLabel: 'Sent for Changes',
              section: 'requests',
              createdAt: nowIso(),
              date: payload.date || job.date,
              dueDate: payload.date || job.dueDate,
              activityLabel: 'Sent',
              activityValue: payload.packagePrice
                ? `Updated ${payload.packagePrice}`
                : payload.notes?.trim()
                  ? 'With notes'
                  : 'Changes sent',
              details: baseDetails
                ? {
                    ...baseDetails,
                    deadline: payload.date || baseDetails.deadline,
                    notes: payload.notes?.trim()
                      ? payload.notes.trim()
                      : baseDetails.notes,
                    packagePrice: nextPrice ?? baseDetails.packagePrice,
                    addons: nextPrice != null ? [] : baseDetails.addons,
                  }
                : baseDetails,
            };
          })
        );
      },
      submitReview: (id, payload) => {
        const rating = Math.min(5, Math.max(1, Math.round(payload.rating)));
        setJobs((prev) =>
          prev.map((job) =>
            job.id === id
              ? {
                  ...job,
                  rating,
                  reviewText: payload.text?.trim() || undefined,
                  reviewImages:
                    payload.images && payload.images.length > 0
                      ? payload.images
                      : undefined,
                  activityLabel: 'Rated',
                  activityValue: `${rating} star${rating === 1 ? '' : 's'}`,
                }
              : job
          )
        );
      },
    }),
    [jobs]
  );

  return <UserJobsContext.Provider value={value}>{children}</UserJobsContext.Provider>;
}

export function useUserJobs() {
  const ctx = useContext(UserJobsContext);
  if (!ctx) throw new Error('useUserJobs must be used within UserJobsProvider');
  return ctx;
}
