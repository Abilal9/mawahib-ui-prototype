import { CatalogService, Story, Talent } from '../data/types';
import { ApiError } from '../lib/apiClient';
import {
  exploreApi,
  mapExploreService,
  mapExploreTalent,
} from './exploreApi';

let servicesCache: CatalogService[] = [];
let talentsCache: Talent[] = [];
let businessesCache: Talent[] = [];
let catalogError: string | null = null;

/**
 * Explore catalog — Nest-backed talents/businesses/services.
 * Stories remain local until a social phase ships.
 */
export const catalogService = {
  get lastError(): string | null {
    return catalogError;
  },

  listServices(): CatalogService[] {
    return servicesCache;
  },

  getServiceById(id: string): CatalogService | undefined {
    return servicesCache.find((s) => s.id === id);
  },

  /** Lets Service Detail open an Explore hit that is outside the Home page. */
  rememberService(service: CatalogService) {
    const index = servicesCache.findIndex((item) => item.id === service.id);
    if (index >= 0) {
      servicesCache = servicesCache.map((item, i) => (i === index ? service : item));
      return;
    }
    servicesCache = [...servicesCache, service];
  },

  listTalents(): Talent[] {
    return talentsCache;
  },

  listBusinesses(): Talent[] {
    return businessesCache;
  },

  listStories(): Story[] {
    return [];
  },

  getStoryById(_id: string): Story | undefined {
    return undefined;
  },

  clearLocalCaches(): void {
    servicesCache = [];
    talentsCache = [];
    businessesCache = [];
    catalogError = null;
  },

  async refresh(): Promise<{
    talents: Talent[];
    businesses: Talent[];
    services: CatalogService[];
  }> {
    try {
      const [talents, services] = await Promise.all([
        exploreApi.listTalents({ take: 50 }),
        exploreApi.listServices({ take: 50 }),
      ]);
      talentsCache = talents.items.map(mapExploreTalent);
      businessesCache = [];
      servicesCache = services.items.map(mapExploreService);
      catalogError = null;
      return {
        talents: talentsCache,
        businesses: businessesCache,
        services: servicesCache,
      };
    } catch (e) {
      catalogError =
        e instanceof ApiError ? e.message : 'Failed to load explore catalog';
      talentsCache = [];
      businessesCache = [];
      servicesCache = [];
      throw e;
    }
  },
};
