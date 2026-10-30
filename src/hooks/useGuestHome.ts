import { useCallback, useEffect, useRef, useState } from 'react';
import { isStaleIdentityError } from '../lib/identityFences';
import { publicErrorMessage } from '../lib/publicErrors';
import {
  fetchPublicExploreServices,
  fetchPublicExploreTalents,
  fetchPublicFeed,
  fetchPublicJobListings,
  PUBLIC_HOME_POSTS_TAKE,
  PUBLIC_HOME_SECTION_TAKE,
  type GuestExploreService,
  type GuestExploreTalent,
  type GuestJob,
  type GuestPost,
} from '../services/publicApi';

export type GuestHomeSection<T> = {
  items: T[];
  error: string | null;
};

export function useGuestHome() {
  const mounted = useRef(true);
  const gen = useRef(0);
  const [talents, setTalents] = useState<GuestHomeSection<GuestExploreTalent>>({
    items: [],
    error: null,
  });
  const [services, setServices] = useState<GuestHomeSection<GuestExploreService>>({
    items: [],
    error: null,
  });
  const [jobs, setJobs] = useState<GuestHomeSection<GuestJob>>({
    items: [],
    error: null,
  });
  const [posts, setPosts] = useState<GuestHomeSection<GuestPost>>({
    items: [],
    error: null,
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async (isRefresh: boolean) => {
    const requestGen = ++gen.current;
    if (isRefresh) setRefreshing(true);
    else setInitialLoading(true);

    const settled = await Promise.allSettled([
      fetchPublicExploreTalents({ skip: 0, take: PUBLIC_HOME_SECTION_TAKE }),
      fetchPublicExploreServices({ skip: 0, take: PUBLIC_HOME_SECTION_TAKE }),
      fetchPublicJobListings({ skip: 0, take: PUBLIC_HOME_SECTION_TAKE }),
      fetchPublicFeed({ take: PUBLIC_HOME_POSTS_TAKE }),
    ]);

    if (requestGen !== gen.current || !mounted.current) return;

    const apply = <T,>(
      result: PromiseSettledResult<{ items: T[] }>,
      setSection: (next: GuestHomeSection<T>) => void,
    ) => {
      if (result.status === 'fulfilled') {
        setSection({ items: result.value.items, error: null });
        return;
      }
      if (isStaleIdentityError(result.reason)) return;
      setSection({
        items: [],
        error: publicErrorMessage(result.reason),
      });
    };

    apply(settled[0], setTalents);
    apply(settled[1], setServices);
    apply(settled[2], setJobs);
    apply(settled[3], setPosts);
    setInitialLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  return {
    talents,
    services,
    jobs,
    posts,
    initialLoading,
    refreshing,
    refresh,
  };
}
