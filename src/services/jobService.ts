import { JobListing } from '../data/types';
import { repositories } from '../repositories';

const repo = repositories.jobListings;

export const jobService = {
  async list(): Promise<JobListing[]> {
    return repo.list();
  },

  listSync(): JobListing[] {
    return repo.list();
  },

  async getById(id: string): Promise<JobListing | undefined> {
    return repo.getById(id);
  },

  getByIdSync(id: string): JobListing | undefined {
    return repo.getById(id);
  },

  createListing(
    input: Omit<JobListing, 'id' | 'postedAt'> & { id?: string }
  ): JobListing {
    return repo.create(input);
  },
};
