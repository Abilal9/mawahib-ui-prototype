/** Keep in sync with the backend explore category limit. */
export const EXPLORE_MAX_CATEGORY_FILTERS = 11;

export interface ExploreTaxonomySelection {
  categoryIds: string[];
}

export interface ExploreCategoryChoice {
  id: string;
  sortOrder: number;
  allowsCustomCategory?: boolean;
  skills: readonly { id: string }[];
}

export function emptyExploreTaxonomy(): ExploreTaxonomySelection {
  return { categoryIds: [] };
}

/**
 * Talent shows categories that own canonical skills.
 * Other is omitted because it owns none and allows a custom label.
 * Services and jobs show the full catalog, including Other.
 */
export function categoriesForExploreTab<T extends ExploreCategoryChoice>(
  categories: readonly T[],
  tab: 'talents' | 'services' | 'jobs',
): T[] {
  const sorted = [...categories].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
  );
  if (tab !== 'talents') return sorted;
  return sorted.filter(
    (category) =>
      category.allowsCustomCategory !== true && category.skills.length > 0,
  );
}

export function toggleExploreCategory(
  ids: readonly string[],
  id: string,
): string[] {
  if (ids.includes(id)) return ids.filter((item) => item !== id);
  if (ids.length >= EXPLORE_MAX_CATEGORY_FILTERS) return [...ids];
  return [...ids, id];
}

export function exploreFilterParams(selection: ExploreTaxonomySelection): {
  categoryIds?: string;
} {
  const categoryIds = [...selection.categoryIds].sort();
  return categoryIds.length > 0 ? { categoryIds: categoryIds.join(',') } : {};
}

export function exploreTaxonomyKey(selection: ExploreTaxonomySelection): string {
  return exploreFilterParams(selection).categoryIds ?? '';
}

export function isInactiveTaxonomyFilterError(message: string): boolean {
  return message.includes('Unknown or inactive category filter.');
}

/** Drop categories the refreshed catalog no longer contains. */
export function pruneExploreSelection(
  selection: ExploreTaxonomySelection,
  categories: readonly { id: string }[],
): ExploreTaxonomySelection {
  const categoryIds = new Set(categories.map((category) => category.id));
  return {
    categoryIds: selection.categoryIds.filter((id) => categoryIds.has(id)),
  };
}

export function acceptExploreResponse(
  currentGeneration: number,
  responseGeneration: number,
): boolean {
  return currentGeneration === responseGeneration;
}

export function clearExploreTab<T extends string>(
  state: Record<T, ExploreTaxonomySelection>,
  tab: T,
): Record<T, ExploreTaxonomySelection> {
  return { ...state, [tab]: emptyExploreTaxonomy() };
}
