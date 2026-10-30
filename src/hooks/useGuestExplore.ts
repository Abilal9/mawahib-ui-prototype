import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { categoriesForExploreTab } from '../domain/exploreTaxonomy';
import { isStaleIdentityError } from '../lib/identityFences';
import { publicErrorMessage } from '../lib/publicErrors';
import {
  fetchPublicExploreServices,
  fetchPublicExploreTalents,
  fetchPublicJobListings,
  fetchPublicTaxonomy,
  PUBLIC_MAX_SKIP,
  PUBLIC_MAX_TAKE,
  PUBLIC_Q_MIN_LENGTH,
  type GuestExploreService,
  type GuestExploreTalent,
  type GuestJob,
  type PublicTaxonomyCategory,
} from '../services/publicApi';
import type { ExploreTab } from '../data/mock/explore';

export const GUEST_EXPLORE_DEBOUNCE_MS = 300;

export type GuestExploreItem =
  | { kind: 'talent'; talent: GuestExploreTalent }
  | { kind: 'service'; service: GuestExploreService }
  | { kind: 'job'; job: GuestJob };

type Bucket = {
  items: GuestExploreItem[];
  error: string | null;
  initialLoading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
};

const emptyBucket = (): Bucket => ({
  items: [],
  error: null,
  initialLoading: true,
  loadingMore: false,
  hasMore: false,
});

function effectiveSearchQ(
  typed: string,
  categoryName: string | null,
): { blocked: boolean; q?: string } {
  const trimmed = typed.trim();
  if (trimmed.length === 1) return { blocked: true };
  if (trimmed.length >= PUBLIC_Q_MIN_LENGTH) return { blocked: false, q: trimmed };
  if (categoryName && categoryName.trim().length >= PUBLIC_Q_MIN_LENGTH) {
    return { blocked: false, q: categoryName.trim() };
  }
  return { blocked: false };
}

export function useGuestExplore(initialTab: ExploreTab = 'talents') {
  const mounted = useRef(true);
  const gen = useRef(0);
  const [tab, setTab] = useState<ExploreTab>(initialTab);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [taxonomy, setTaxonomy] = useState<PublicTaxonomyCategory[]>([]);
  const [taxonomyError, setTaxonomyError] = useState<string | null>(null);
  const [bucket, setBucket] = useState<Bucket>(emptyBucket);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    const delay = trimmed ? GUEST_EXPLORE_DEBOUNCE_MS : 0;
    const timer = setTimeout(() => setDebouncedQuery(query), delay);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    void fetchPublicTaxonomy()
      .then((catalog) => {
        if (cancelled || !mounted.current) return;
        setTaxonomy(catalog.categories);
        setTaxonomyError(null);
      })
      .catch((error) => {
        if (cancelled || !mounted.current) return;
        if (isStaleIdentityError(error)) return;
        setTaxonomyError(publicErrorMessage(error));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(
    () => categoriesForExploreTab(taxonomy, tab),
    [taxonomy, tab],
  );

  const selectedCategoryName = useMemo(() => {
    if (!selectedCategoryId) return null;
    return categories.find((item) => item.id === selectedCategoryId)?.nameEn ?? null;
  }, [categories, selectedCategoryId]);

  const search = effectiveSearchQ(debouncedQuery, selectedCategoryName);

  const load = useCallback(
    async (mode: 'reset' | 'more' | 'refresh') => {
      if (search.blocked) return;
      const requestGen = mode === 'more' ? gen.current : ++gen.current;
      if (mode === 'reset') {
        setBucket({
          items: [],
          error: null,
          initialLoading: true,
          loadingMore: false,
          hasMore: false,
        });
      } else if (mode === 'refresh') {
        setBucket((current) => ({ ...current, error: null }));
      } else {
        setBucket((current) => ({ ...current, loadingMore: true }));
      }

      const skip = mode === 'more' ? bucket.items.length : 0;
      if (skip > PUBLIC_MAX_SKIP) {
        setBucket((current) => ({ ...current, loadingMore: false, hasMore: false }));
        return;
      }

      try {
        const queryInput = {
          q: search.q,
          skip,
          take: PUBLIC_MAX_TAKE,
        };
        let nextItems: GuestExploreItem[] = [];
        let pageLen = 0;
        if (tab === 'talents') {
          const page = await fetchPublicExploreTalents(queryInput);
          pageLen = page.items.length;
          nextItems = page.items.map((talent) => ({ kind: 'talent' as const, talent }));
        } else if (tab === 'services') {
          const page = await fetchPublicExploreServices(queryInput);
          pageLen = page.items.length;
          nextItems = page.items.map((service) => ({
            kind: 'service' as const,
            service,
          }));
        } else {
          const page = await fetchPublicJobListings(queryInput);
          pageLen = page.items.length;
          nextItems = page.items.map((job) => ({ kind: 'job' as const, job }));
        }

        if (requestGen !== gen.current || !mounted.current) return;
        setBucket((current) => {
          const items = mode === 'more' ? [...current.items, ...nextItems] : nextItems;
          return {
            items,
            error: null,
            initialLoading: false,
            loadingMore: false,
            hasMore:
              pageLen >= PUBLIC_MAX_TAKE && skip + pageLen <= PUBLIC_MAX_SKIP,
          };
        });
      } catch (error) {
        if (isStaleIdentityError(error)) return;
        if (requestGen !== gen.current || !mounted.current) return;
        setBucket((current) => ({
          items: mode === 'reset' ? [] : current.items,
          error: publicErrorMessage(error),
          initialLoading: false,
          loadingMore: false,
          hasMore: false,
        }));
      }
    },
    [bucket.items.length, search.blocked, search.q, tab],
  );

  useEffect(() => {
    setSelectedCategoryId(null);
  }, [tab]);

  useEffect(() => {
    if (debouncedQuery.trim().length >= PUBLIC_Q_MIN_LENGTH) {
      setSelectedCategoryId(null);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    if (search.blocked) return;
    void load('reset');
    // Intentionally reload when tab or effective q changes, not on load identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, search.blocked, search.q]);

  const loadMore = useCallback(() => {
    if (
      search.blocked ||
      bucket.initialLoading ||
      bucket.loadingMore ||
      !bucket.hasMore ||
      bucket.items.length > PUBLIC_MAX_SKIP
    ) {
      return;
    }
    void load('more');
  }, [bucket.hasMore, bucket.initialLoading, bucket.items.length, bucket.loadingMore, load, search.blocked]);

  const refresh = useCallback(() => {
    void load('refresh');
  }, [load]);

  const toggleCategory = useCallback((id: string) => {
    setSelectedCategoryId((current) => (current === id ? null : id));
  }, []);

  return {
    tab,
    setTab,
    query,
    setQuery,
    categories,
    selectedCategoryId,
    toggleCategory,
    taxonomyError,
    items: bucket.items,
    error: bucket.error,
    initialLoading: bucket.initialLoading,
    loadingMore: bucket.loadingMore,
    hasMore: bucket.hasMore,
    searchBlocked: search.blocked,
    refresh,
    loadMore,
  };
}
