import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import { ApiEngagement, marketplaceApi } from '../services/marketplaceApi';
import { chargeableAmount } from '../utils/chargeableTotal';

/** Loads the engagement a payment screen is about and decides if it can be paid. */
export function usePayableEngagement(engagementId: string) {
  const { apiUser } = useAuth();
  const [engagement, setEngagement] = useState<ApiEngagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEngagement(await marketplaceApi.getEngagement(engagementId));
    } catch (e) {
      setEngagement(null);
      setError(
        e instanceof ApiError ? e.message : 'Could not load this payment',
      );
    } finally {
      setLoading(false);
    }
  }, [engagementId]);

  useEffect(() => {
    void load();
  }, [load]);

  const amount = chargeableAmount(engagement?.detail);
  const isClient = Boolean(
    apiUser && engagement && engagement.clientId === apiUser.id,
  );
  const alreadyPaid =
    engagement != null &&
    engagement.status !== 'pending_payment' &&
    engagement.status !== 'payment_failed';

  /** Reason the viewer cannot pay right now, or null when they can. */
  let blockedReason: string | null = null;
  if (engagement) {
    if (!isClient) blockedReason = 'Only the client can pay for this job.';
    else if (alreadyPaid) blockedReason = 'This job has already been paid.';
    else if (amount === null)
      blockedReason = 'This job has no payable amount yet.';
  }

  return {
    engagement,
    loading,
    error,
    reload: load,
    amount,
    currency: engagement?.detail?.currency ?? null,
    isClient,
    alreadyPaid,
    blockedReason,
    canPay: Boolean(engagement) && blockedReason === null,
  };
}
