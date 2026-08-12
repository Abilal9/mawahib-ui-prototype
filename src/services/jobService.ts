import { JobListing } from '../data/types';
import { ApiError } from '../lib/apiClient';
import {
  mapApiListingToJob,
  marketplaceApi,
} from './marketplaceApi';

let cache: JobListing[] = [];
let cacheError: string | null = null;

export const jobService = {
  get lastError(): string | null {
    return cacheError;
  },

  /** Cached open listings from the last successful fetch (may be empty). */
  listSync(): JobListing[] {
    return cache;
  },

  getByIdSync(id: string): JobListing | undefined {
    return cache.find((j) => j.id === id);
  },

  async refresh(params?: {
    q?: string;
    exploreTag?: string;
  }): Promise<JobListing[]> {
    try {
      const page = await marketplaceApi.listOpenListings({
        take: 50,
        ...params,
      });
      cache = page.items.map(mapApiListingToJob);
      cacheError = null;
      return cache;
    } catch (e) {
      cacheError =
        e instanceof ApiError ? e.message : 'Failed to load job listings';
      throw e;
    }
  },

  async list(): Promise<JobListing[]> {
    return this.refresh();
  },

  async getById(id: string): Promise<JobListing | undefined> {
    const cached = this.getByIdSync(id);
    if (cached) return cached;
    try {
      const api = await marketplaceApi.getListing(id);
      const mapped = mapApiListingToJob(api);
      if (!cache.some((j) => j.id === mapped.id)) {
        cache = [mapped, ...cache];
      }
      return mapped;
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return undefined;
      throw e;
    }
  },

  async createListing(input: {
    title: string;
    company?: string;
    type: JobListing['type'];
    location: string;
    salary?: string;
    description?: string;
    skills?: string[];
    exploreTag?: string;
    publish?: boolean;
  }): Promise<JobListing> {
    const created = await marketplaceApi.createListing({
      title: input.title,
      companyName: input.company,
      employmentType: input.type,
      location: input.location,
      salaryLabel: input.salary,
      description: input.description,
      skills: input.skills,
      exploreTag: input.exploreTag,
      publish: input.publish ?? true,
    });
    const mapped = mapApiListingToJob(created);
    if (created.status === 'open') {
      cache = [mapped, ...cache.filter((j) => j.id !== mapped.id)];
    }
    return mapped;
  },
};
