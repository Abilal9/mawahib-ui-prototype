import { services, getServiceById } from '../../data/mock/services';
import { talents } from '../../data/mock/talents';
import { stories, getStoryById } from '../../data/mock/stories';
import { CatalogRepository } from '../types';

export const mockCatalogRepository: CatalogRepository = {
  listServices: () => services,
  getServiceById: (id) => getServiceById(id),
  listTalents: () => talents,
  listStories: () => stories,
  getStoryById: (id) => getStoryById(id),
};
