import { JobListing } from '../../data/types';
import { JobListingRepository } from '../types';

/**
 * Marketplace listings are served by Nest (`jobService` → marketplaceApi).
 * This mock remains only so the repository registry type-checks; it stays empty.
 */
let listings: JobListing[] = [];

export const mockJobListingRepository: JobListingRepository = {
  list: () => listings,
  getById: (id) => listings.find((j) => j.id === id),
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
