export const exploreTabs = [
  { id: 'talents', label: 'Talents' },
  { id: 'services', label: 'Services' },
  { id: 'jobs', label: 'Jobs' },
] as const;

export type ExploreTab = (typeof exploreTabs)[number]['id'];

/** @deprecated use ExploreTab — kept for older navigations */
export type ExploreContentType = ExploreTab | 'all' | 'posts';
