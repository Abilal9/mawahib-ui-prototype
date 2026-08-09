import { JobListing } from '../../data/types';
import { jobs as seedJobs, getJobById } from '../../data/mock/jobs';
import { JobListingRepository } from '../types';

let listings: JobListing[] = [...seedJobs];

/** Catalog job listings — mock; swap for Supabase later. */
export const mockJobListingRepository: JobListingRepository = {
  list: () => listings,
  getById: (id) => listings.find((j) => j.id === id) ?? getJobById(id),
  create: (input) => {
    const listing: JobListing = {
      id: input.id ?? `job-${Date.now()}`,
      title: input.title,
      company: input.company,
      type: input.type,
      location: input.location,
      salary: input.salary,
      description: input.description,
      skills: input.skills,
      postedAt: new Date().toISOString(),
      status: input.status ?? 'open',
      matchScore: input.matchScore,
      logo: input.logo,
      exploreTag: input.exploreTag,
    };
    listings = [listing, ...listings];
    return listing;
  },
};
