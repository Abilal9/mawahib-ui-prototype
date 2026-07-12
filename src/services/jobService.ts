import { Job } from '../data/types';
import { jobs, getJobById } from '../data/mock/jobs';

export const jobService = {
  async list(): Promise<Job[]> {
    return jobs;
  },

  async getById(id: string): Promise<Job | undefined> {
    return getJobById(id);
  },
};
