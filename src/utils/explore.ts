import { Job, Post, Service, Talent } from '../data/types';
import { ExploreFilters, ExploreTab } from '../data/mock/explore';

function matchesLocation(text: string, location: ExploreFilters['location']) {
  if (location === 'all') return true;
  const value = text.toLowerCase();
  if (location === 'dubai') return value.includes('dubai');
  if (location === 'riyadh') return value.includes('riyadh');
  if (location === 'remote') return value.includes('remote');
  return true;
}

function matchesQuery(query: string, values: string[]) {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  return values.some((v) => v.toLowerCase().includes(q));
}

function matchesChip(chip: string | null, tags: string[] = []) {
  if (!chip) return true;
  return tags.some((t) => t.toLowerCase() === chip.toLowerCase());
}

export function filterTalents(
  items: Talent[],
  query: string,
  chip: string | null,
  filters: ExploreFilters
) {
  return items
    .filter((item) => matchesChip(chip, item.tags ?? [item.category]))
    .filter((item) =>
      matchesQuery(query, [
        item.user.name,
        item.user.username,
        item.user.title ?? '',
        item.category,
        ...item.skills,
        item.user.location ?? '',
      ])
    )
    .filter((item) => matchesLocation(item.user.location ?? '', filters.location))
    .sort((a, b) => sortTalents(a, b, filters.sort));
}

export function filterJobs(
  items: Job[],
  query: string,
  chip: string | null,
  filters: ExploreFilters
) {
  return items
    .filter((item) => {
      if (!chip) return true;
      const needle = chip.toLowerCase();
      return (
        (item.exploreTag ?? '').toLowerCase() === needle ||
        item.title.toLowerCase().includes(needle) ||
        item.skills.some((s) => s.toLowerCase().includes(needle))
      );
    })
    .filter((item) =>
      matchesQuery(query, [
        item.title,
        item.company,
        item.location,
        item.description,
        ...item.skills,
      ])
    )
    .filter((item) => matchesLocation(item.location, filters.location))
    .filter((item) => {
      if (filters.jobType === 'all') return true;
      if (filters.jobType === 'freelance' && item.type === 'gig') return true;
      return item.type === filters.jobType;
    })
    .sort((a, b) => sortJobs(a, b, filters.sort));
}

export function filterServices(
  items: Service[],
  query: string,
  chip: string | null,
  filters: ExploreFilters
) {
  return items
    .filter((item) => {
      if (!chip) return true;
      const needle = chip.toLowerCase();
      return (
        (item.exploreTag ?? item.category).toLowerCase() === needle ||
        item.category.toLowerCase() === needle
      );
    })
    .filter((item) =>
      matchesQuery(query, [
        item.title,
        item.description,
        item.category,
        item.provider.name,
        item.provider.location ?? '',
      ])
    )
    .filter((item) => matchesLocation(item.provider.location ?? '', filters.location))
    .sort((a, b) => sortServices(a, b, filters.sort));
}

export function filterPosts(
  items: Post[],
  query: string,
  chip: string | null,
  filters: ExploreFilters
) {
  return items
    .filter((item) => {
      if (!chip) return true;
      const role = item.role ?? item.author.skills?.join(' ') ?? '';
      return role.toLowerCase().includes(chip.toLowerCase());
    })
    .filter((item) =>
      matchesQuery(query, [
        item.caption,
        item.author.name,
        item.location ?? '',
        item.role ?? '',
      ])
    )
    .filter((item) => matchesLocation(item.location ?? item.author.location ?? '', filters.location))
    .sort((a, b) => sortPosts(a, b, filters.sort));
}

function sortTalents(a: Talent, b: Talent, sort: ExploreFilters['sort']) {
  if (sort === 'top-rated') return b.rating - a.rating;
  if (sort === 'price-low') return a.hourlyRate - b.hourlyRate;
  if (sort === 'price-high') return b.hourlyRate - a.hourlyRate;
  return b.rating - a.rating;
}

function sortJobs(a: Job, b: Job, sort: ExploreFilters['sort']) {
  if (sort === 'newest') return Date.parse(b.postedAt) - Date.parse(a.postedAt);
  if (sort === 'top-rated') return (b.matchScore ?? 0) - (a.matchScore ?? 0);
  return (b.matchScore ?? 0) - (a.matchScore ?? 0);
}

function sortServices(a: Service, b: Service, sort: ExploreFilters['sort']) {
  if (sort === 'top-rated') return b.rating - a.rating;
  if (sort === 'price-low') return a.price - b.price;
  if (sort === 'price-high') return b.price - a.price;
  if (sort === 'newest') return b.reviewCount - a.reviewCount;
  return b.rating - a.rating;
}

function sortPosts(a: Post, b: Post, sort: ExploreFilters['sort']) {
  if (sort === 'newest') return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  if (sort === 'top-rated') return b.likes - a.likes;
  return Date.parse(b.createdAt) - Date.parse(a.createdAt);
}

export function normalizeExploreTab(
  value?: string
): ExploreTab {
  if (value === 'services' || value === 'jobs') return value;
  return 'talents';
}
