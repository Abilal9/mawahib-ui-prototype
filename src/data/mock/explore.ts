export const exploreCategories = [
  'All',
  'Design',
  'Development',
  'Photography',
  'Video',
  'Illustration',
  'Writing',
] as const;

export type ExploreCategory = (typeof exploreCategories)[number];

export const exploreContentTypes = [
  { id: 'all', label: 'All' },
  { id: 'talents', label: 'Talents' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'services', label: 'Services' },
  { id: 'posts', label: 'Posts' },
] as const;

export type ExploreContentType = (typeof exploreContentTypes)[number]['id'];

export type ExploreSort = 'recommended' | 'top-rated' | 'newest' | 'price-low' | 'price-high';

export type ExploreLocation = 'all' | 'dubai' | 'riyadh' | 'remote';

export type ExploreJobType = 'all' | 'full-time' | 'part-time' | 'contract' | 'freelance';

export interface ExploreFilters {
  sort: ExploreSort;
  location: ExploreLocation;
  jobType: ExploreJobType;
}

export const defaultExploreFilters: ExploreFilters = {
  sort: 'recommended',
  location: 'all',
  jobType: 'all',
};
