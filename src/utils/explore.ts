import { Job, Post, Service, Talent } from '../data/types';
import {
  ExploreCategory,
  ExploreContentType,
  ExploreFilters,
} from '../data/mock/explore';

function matchesLocation(text: string, location: ExploreFilters['location']) {
  if (location === 'all') return true;
  const value = text.toLowerCase();
  if (location === 'dubai') return value.includes('dubai');
  if (location === 'riyadh') return value.includes('riyadh');
  if (location === 'remote') return value.includes('remote');
  return true;
}

function matchesCategory(category: string, selected: ExploreCategory) {
  return selected === 'All' || category.toLowerCase() === selected.toLowerCase();
}

function matchesQuery(query: string, values: string[]) {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  return values.some((v) => v.toLowerCase().includes(q));
}

export function filterTalents(
  items: Talent[],
  query: string,
  category: ExploreCategory,
  filters: ExploreFilters
) {
  return items
    .filter((item) => matchesCategory(item.category, category))
    .filter((item) =>
      matchesQuery(query, [
        item.user.name,
        item.user.username,
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
  category: ExploreCategory,
  filters: ExploreFilters
) {
  return items
    .filter((item) => {
      if (category === 'All') return true;
      const map: Record<string, string> = {
        Design: 'design',
        Development: 'developer',
        Photography: 'photograph',
        Video: 'video',
        Illustration: 'illustration',
        Writing: 'writing',
      };
      const needle = map[category] ?? category.toLowerCase();
      return (
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
    .filter((item) => filters.jobType === 'all' || item.type === filters.jobType)
    .sort((a, b) => sortJobs(a, b, filters.sort));
}

export function filterServices(
  items: Service[],
  query: string,
  category: ExploreCategory,
  filters: ExploreFilters
) {
  return items
    .filter((item) => matchesCategory(item.category, category))
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
  category: ExploreCategory,
  filters: ExploreFilters
) {
  return items
    .filter((item) => {
      if (category === 'All') return true;
      const role = item.role ?? item.author.skills?.join(' ') ?? '';
      return role.toLowerCase().includes(category.toLowerCase());
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

export function getExploreSectionTitle(contentType: ExploreContentType, query: string) {
  if (query) return 'Results';
  if (contentType === 'all') return 'Discover';
  if (contentType === 'talents') return 'Top Talents';
  if (contentType === 'jobs') return 'Open Jobs';
  if (contentType === 'services') return 'Services';
  return 'Posts';
}
