import React, { createContext, useContext, useMemo, useState } from 'react';
import { userJobs as seedJobs } from '../data/mock/userJobs';
import { UserJob } from '../data/types/userJobs';

interface RequestEditsPayload {
  date: string;
  packagePrice: string;
  notes?: string;
}

interface UserJobsContextValue {
  jobs: UserJob[];
  getJobById: (id: string) => UserJob | undefined;
  acceptJob: (id: string) => void;
  declineJob: (id: string, reason?: string) => void;
  requestEdits: (id: string, payload: RequestEditsPayload) => void;
}

const UserJobsContext = createContext<UserJobsContextValue | undefined>(undefined);

function nowIso() {
  return new Date().toISOString();
}

export function UserJobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<UserJob[]>(seedJobs);

  const value = useMemo<UserJobsContextValue>(
    () => ({
      jobs,
      getJobById: (id) => jobs.find((j) => j.id === id),
      acceptJob: (id) => {
        setJobs((prev) =>
          prev.map((job) =>
            job.id === id
              ? {
                  ...job,
                  status: 'pending-payment',
                  statusLabel: 'Pending Payment',
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
          prev.map((job) =>
            job.id === id
              ? {
                  ...job,
                  status: 'sent-for-review',
                  statusLabel: 'Sent for Changes',
                  createdAt: nowIso(),
                  date: payload.date || job.date,
                  activityLabel: 'Sent',
                  activityValue: payload.packagePrice
                    ? `Updated ${payload.packagePrice}`
                    : payload.notes?.trim()
                      ? 'With notes'
                      : 'Changes sent',
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
