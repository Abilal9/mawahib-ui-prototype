import { useCallback, useEffect, useRef, useState } from 'react';
import { isBackendUserId } from '../lib/isBackendUserId';
import { isStaleIdentityError } from '../lib/identityFences';
import { isPublicNotFound, publicErrorMessage } from '../lib/publicErrors';
import {
  fetchPublicService,
  fetchPublicServiceReviews,
  type GuestReview,
  type GuestService,
} from '../services/publicApi';

export function useGuestService(serviceId: string | undefined) {
  const mounted = useRef(true);
  const gen = useRef(0);
  const valid = isBackendUserId(serviceId);
  const [service, setService] = useState<GuestService | null>(null);
  const [reviews, setReviews] = useState<GuestReview[]>([]);
  const [reviewsCursor, setReviewsCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(!valid);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    const requestGen = ++gen.current;
    if (!valid || !serviceId) {
      setNotFound(true);
      setService(null);
      setLoading(false);
      setReviewsLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setReviewsLoading(true);
    setError(null);
    setReviewsError(null);
    setNotFound(false);
    try {
      const next = await fetchPublicService(serviceId);
      if (requestGen !== gen.current || !mounted.current) return;
      setService(next);
      setLoading(false);
    } catch (reason) {
      if (isStaleIdentityError(reason)) return;
      if (requestGen !== gen.current || !mounted.current) return;
      setService(null);
      setLoading(false);
      setReviewsLoading(false);
      setNotFound(isPublicNotFound(reason));
      setError(publicErrorMessage(reason));
      return;
    }

    try {
      const page = await fetchPublicServiceReviews(serviceId, { take: 20 });
      if (requestGen !== gen.current || !mounted.current) return;
      setReviews(page.items);
      setReviewsCursor(page.nextCursor);
      setReviewsLoading(false);
    } catch (reason) {
      if (isStaleIdentityError(reason)) return;
      if (requestGen !== gen.current || !mounted.current) return;
      setReviews([]);
      setReviewsCursor(null);
      setReviewsLoading(false);
      setReviewsError(publicErrorMessage(reason));
    }
  }, [serviceId, valid]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    service,
    reviews,
    reviewsCursor,
    loading,
    reviewsLoading,
    error,
    reviewsError,
    notFound,
    refresh: load,
  };
}
