import React, { createContext, useContext, useMemo, useState } from 'react';
import { userJobs as seedJobs } from '../data/mock/userJobs';
import { getJobById as getListingById } from '../data/mock/jobs';
import { users } from '../data/mock/users';
import { UserJob, UserJobDetails } from '../data/types/userJobs';
import { Job } from '../data/types';

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

interface UserJobsContextValue {
  jobs: UserJob[];
  getJobById: (id: string) => UserJob | undefined;
  /** Create or reuse a received pending request from an explore listing; returns user-job id */
  openFromListing: (listingId: string) => string | undefined;
  acceptJob: (id: string) => void;
  declineJob: (id: string, reason?: string) => void;
  requestEdits: (id: string, payload: RequestEditsPayload) => void;
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

function userJobFromListing(listing: Job): UserJob {
  return {
    id: `uj-from-${listing.id}`,
    listingId: listing.id,
    title: listing.title,
    type: 'received',
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
    activityLabel: 'Requested',
    activityValue: 'Just Now',
    details: detailsFromListing(listing),
  };
}

export function UserJobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<UserJob[]>(seedJobs);

  const value = useMemo<UserJobsContextValue>(
    () => ({
      jobs,
      getJobById: (id) =>
        jobs.find((j) => j.id === id || j.listingId === id),
      openFromListing: (listingId) => {
        const existing = jobs.find((j) => j.listingId === listingId || j.id === listingId);
        if (existing) return existing.id;

        const listing = getListingById(listingId);
        if (!listing) return undefined;

        const created = userJobFromListing(listing);
        setJobs((prev) => [created, ...prev]);
        return created.id;
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
