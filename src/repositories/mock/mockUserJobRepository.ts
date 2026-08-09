import { UserJob } from '../../data/types/userJobs';
import { userJobs as seedJobs } from '../../data/mock/userJobs';
import { UserJobRepository } from '../types';

let jobs: UserJob[] = [...seedJobs];

/** In-app UserJob engagements — mock store. */
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
