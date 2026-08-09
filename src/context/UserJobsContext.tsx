import React, { createContext, useContext, useMemo, useState } from 'react';
import { User, JobListing } from '../data/types';
import { UserJob, UserJobAddon, UserJobDetails } from '../data/types/userJobs';
import { jobService, userService } from '../services';
import { repositories } from '../repositories';

/**
 * In-memory jobs store for the prototype.
 * Seeds via userJob repository; listing lookups via jobService.
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
  /** Business posts a job listing + a "posted" UserJob row */
  createPostedJob: (payload: CreatePostedJobPayload) => string;
  acceptJob: (id: string) => void;
  declineJob: (id: string, reason?: string) => void;
  requestEdits: (id: string, payload: RequestEditsPayload) => void;
  /** After client pays a pending-payment job → moves to in-progress */
  markJobPaid: (id: string) => void;
  /** in-progress → completed (canonical terminal success; `done` treated as alias in filters) */
  markJobCompleted: (id: string) => void;
  /** Provider re-accepts after sent-for-review → pending-payment */
  acceptAfterReview: (id: string) => void;
  submitReview: (id: string, payload: SubmitReviewPayload) => void;
}

const UserJobsContext = createContext<UserJobsContextValue | undefined>(undefined);

function nowIso() {
  return new Date().toISOString();
}

function detailsFromListing(listing: JobListing): UserJobDetails {
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
function applicationFromListing(listing: JobListing): UserJob {
  const directory = userService.listSync();
  return {
    id: `uj-apply-${listing.id}`,
    listingId: listing.id,
    title: listing.title,
    type: 'sent',
    status: 'pending',
    statusLabel: 'Pending',
    counterpart: {
      ...directory[1],
      id: `listing-${listing.id}`,
      name: listing.company,
      avatar: listing.logo ?? directory[1]?.avatar,
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

function findExistingApplication(jobs: UserJob[], listingId: string) {
  return jobs.find(
    (j) => (j.listingId === listingId || j.id === listingId) && j.type === 'sent'
  );
}

export function UserJobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<UserJob[]>(() => repositories.userJobs.list());

  const syncJobs = (updater: (prev: UserJob[]) => UserJob[]) => {
    setJobs((prev) => {
      const next = updater(prev);
      repositories.userJobs.replaceAll(next);
      return next;
    });
  };

  const value = useMemo<UserJobsContextValue>(
    () => ({
      jobs,
      getJobById: (id) =>
        jobs.find((j) => j.id === id || j.listingId === id),
      applyToListing: (listingId) => {
        const existing = findExistingApplication(jobs, listingId);
        if (existing) return existing.id;
        const listing = jobService.getByIdSync(listingId);
        if (!listing) return undefined;
        const created = applicationFromListing(listing);
        syncJobs((prev) => [created, ...prev]);
        return created.id;
      },
      openFromListing: (listingId) => {
        const existing = findExistingApplication(jobs, listingId);
        if (existing) return existing.id;
        const listing = jobService.getByIdSync(listingId);
        if (!listing) return undefined;
        const created = applicationFromListing(listing);
        syncJobs((prev) => [created, ...prev]);
        return created.id;
      },
      createServiceRequest: (payload) => {
        const id = `uj-req-${Date.now()}`;
        const deadline = payload.deadline?.trim() || undefined;
        const dateLabel =
          payload.dateLabel?.trim() || deadline || 'Flexible';
        const locationParts = [
          payload.locationDetails?.trim(),
          payload.city?.trim(),
          payload.country?.trim(),
        ].filter(Boolean);
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
            notes: [
              payload.notes?.trim() || '',
              locationParts.length
                ? `Location: ${locationParts.join(', ')}`
                : '',
            ]
              .filter(Boolean)
              .join('\n\n'),
            attachmentName: payload.attachmentName?.trim() || '',
            attachmentSize: payload.attachmentSize?.trim() || '',
            packagePrice: payload.packagePrice,
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
        syncJobs((prev) => [created, ...prev]);
        return id;
      },
      createPostedJob: (payload) => {
        const me = userService.getCurrentSync();
        const listing = jobService.createListing({
          title: payload.title.trim() || 'Untitled job',
          company: me.name,
          type: payload.jobType ?? 'freelance',
          location: payload.location?.trim() || me.location || 'Remote',
          salary: payload.budget?.trim() || 'Negotiable',
          description: payload.description?.trim() || 'Job posted from Mawahib.',
          skills: payload.skills ?? [],
          status: 'open',
          logo: typeof me.avatar === 'string' ? me.avatar : undefined,
          exploreTag: 'Design',
        });
        const id = `uj-posted-${listing.id}`;
        const created: UserJob = {
          id,
          listingId: listing.id,
          title: listing.title,
          type: 'received',
          status: 'pending',
          statusLabel: 'Open',
          counterpart: me,
          date: listing.salary,
          createdAt: nowIso(),
          section: 'posted',
          jobType: listing.type,
          activityLabel: 'Posted',
          activityValue: 'Just Now',
          details: detailsFromListing(listing),
        };
        syncJobs((prev) => [created, ...prev]);
        return id;
      },
      acceptJob: (id) => {
        syncJobs((prev) =>
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
      acceptAfterReview: (id) => {
        syncJobs((prev) =>
          prev.map((job) =>
            job.id === id
              ? {
                  ...job,
                  status: 'pending-payment',
                  statusLabel: 'Pending Payment',
                  section: 'requests',
                  createdAt: nowIso(),
                  activityLabel: 'Accepted',
                  activityValue: 'Just Now',
                }
              : job
          )
        );
      },
      markJobPaid: (id) => {
        syncJobs((prev) =>
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
      markJobCompleted: (id) => {
        syncJobs((prev) =>
          prev.map((job) =>
            job.id === id
              ? {
                  ...job,
                  status: 'completed',
                  statusLabel: 'Completed',
                  section: 'completed',
                  createdAt: nowIso(),
                  activityLabel: 'Completed',
                  activityValue: 'Just Now',
                }
              : job
          )
        );
      },
      declineJob: (id, reason) => {
        syncJobs((prev) =>
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
        syncJobs((prev) =>
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
        syncJobs((prev) =>
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
