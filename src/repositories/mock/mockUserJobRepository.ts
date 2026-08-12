import { UserJob } from '../../data/types/userJobs';
import { UserJobRepository } from '../types';

/**
 * Marketplace applications/engagements load from Nest via UserJobsContext.
 * Local mock store stays empty (no seed fallback).
 */
let jobs: UserJob[] = [];

export const mockUserJobRepository: UserJobRepository = {
  list: () => jobs,
  getById: (id) => jobs.find((j) => j.id === id || j.listingId === id),
  upsert: (job) => {
    const idx = jobs.findIndex((j) => j.id === job.id);
    if (idx >= 0) {
      jobs = [...jobs.slice(0, idx), job, ...jobs.slice(idx + 1)];
    } else {
      jobs = [job, ...jobs];
    }
  },
  replaceAll: (next) => {
    jobs = next;
  },
};
