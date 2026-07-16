export const exploreTabs = [
  { id: 'talents', label: 'Talents' },
  { id: 'services', label: 'Services' },
  { id: 'jobs', label: 'Jobs' },
] as const;

export type ExploreTab = (typeof exploreTabs)[number]['id'];

/** @deprecated use ExploreTab — kept for older navigations */
export type ExploreContentType = ExploreTab | 'all' | 'posts';

export const talentFilters = [
  'Saudi Made',
  'Local Talent',
  'Visual Artists',
  'Photographers',
  'Videographers',
  'Performers',
] as const;

export const serviceFilters = [
  'Music',
  'Events',
  'Design',
  'Photography',
  'Video',
  'Development',
  'Coaching',
] as const;

export const jobFilters = [
  'Tech',
  'Design',
  'Media',
  'Events',
  'Food',
  'Business',
] as const;

export type ExploreChip =
  | (typeof talentFilters)[number]
  | (typeof serviceFilters)[number]
  | (typeof jobFilters)[number]
  | 'All';

/** Legacy category chips — map soft to filter chips */
export type ExploreCategory = string;

export type ExploreSort = 'recommended' | 'top-rated' | 'newest' | 'price-low' | 'price-high';

export type ExploreLocation = 'all' | 'dubai' | 'riyadh' | 'remote';

export type ExploreJobType = 'all' | 'full-time' | 'part-time' | 'contract' | 'freelance' | 'gig';

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

export function chipsForTab(tab: ExploreTab): readonly string[] {
  if (tab === 'talents') return talentFilters;
  if (tab === 'services') return serviceFilters;
  return jobFilters;
}
