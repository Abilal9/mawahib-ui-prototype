import { ExploreTab } from '../data/mock/explore';

export function normalizeExploreTab(value?: string): ExploreTab {
  if (value === 'services' || value === 'jobs') return value;
  return 'talents';
}
