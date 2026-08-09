import { CatalogService, Story, Talent } from '../data/types';
import { repositories } from '../repositories';

const repo = repositories.catalog;

export const catalogService = {
  listServices(): CatalogService[] {
    return repo.listServices();
  },

  getServiceById(id: string): CatalogService | undefined {
    return repo.getServiceById(id);
  },

  listTalents(): Talent[] {
    return repo.listTalents();
  },

  listStories(): Story[] {
    return repo.listStories();
  },

  getStoryById(id: string): Story | undefined {
    return repo.getStoryById(id);
  },
};
