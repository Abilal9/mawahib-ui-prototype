import { useCallback, useRef, useState } from 'react';
import { ApiError } from '../lib/apiClient';
import {
  ApiPayment,
  ApiPaymentMethod,
  newPaymentIdempotencyKey,
  paymentsApi,
} from '../services/paymentsApi';
import type { MockPaymentToken } from '../utils/cardValidation';

export interface EngagementPaymentState {
  paying: boolean;
  payment: ApiPayment | null;
  error: string | null;
  /** True once a payment for this engagement succeeded. */
  succeeded: boolean;
  /**
   * Starts a payment. Resolves with the payment (check `status`) or null when
   * the request itself failed / was ignored as a double-submit.
   */
  pay: (
    method: ApiPaymentMethod,
    mockMethodToken: MockPaymentToken,
  ) => Promise<ApiPayment | null>;
  clearError: () => void;
}

async function pollPayment(paymentId: string): Promise<ApiPayment> {
  let latest: ApiPayment | null = null;
  for (let i = 0; i < 6; i++) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    latest = await paymentsApi.get(paymentId);
    if (latest.status !== 'pending' && latest.status !== 'processing') {
      return latest;
    }
  }
  return latest!;
}

/**
 * Drives POST /payments for one engagement.
 *
 * - Double-submit safe: a second `pay` while one is in flight is ignored.
 * - Idempotency: the same key is reused when retrying the same method/token
 *   after a transport error (the server replays the original payment); a new
 *   key is minted after a declined payment or when the method/token changes.
 * - No card data ever reaches this hook — only the mock token.
 */
export function useEngagementPayment(
  engagementId: string,
): EngagementPaymentState {
  const [paying, setPaying] = useState(false);
  const [payment, setPayment] = useState<ApiPayment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const attempt = useRef<{ key: string; fingerprint: string } | null>(null);

  const pay = useCallback(
    async (method: ApiPaymentMethod, mockMethodToken: MockPaymentToken) => {
      if (inFlight.current) return null;
      inFlight.current = true;
      setPaying(true);
      setError(null);

      const fingerprint = `${method}:${mockMethodToken}`;
      if (!attempt.current || attempt.current.fingerprint !== fingerprint) {
        attempt.current = { key: newPaymentIdempotencyKey(), fingerprint };
      }
      try {
        let result = await paymentsApi.create({
          engagementId,
          method,
          mockMethodToken,
          idempotencyKey: attempt.current.key,
        });
        if (result.status === 'pending' || result.status === 'processing') {
          // Same key is still in flight. Keep it and refetch; do not start
          // another attempt or show this as a decline.
          result = await pollPayment(result.id);
        }
        setPayment(result);
        if (result.status === 'succeeded') return result;
        if (result.status === 'pending' || result.status === 'processing') {
          setError(
            'Payment is still processing. Wait a moment, then try again.',
          );
          return result;
        }
        // A declined attempt is final for that key — retry needs a new one.
        attempt.current = null;
        setError(
          result.failureMessage?.trim() ||
            'The payment was declined. Please try another method.',
        );
        return result;
      } catch (e) {
        if (e instanceof ApiError) {
          // Validation / state errors are not retryable with the same key.
          attempt.current = null;
          setError(e.message);
        } else {
          // Transport error: keep the key so a retry cannot double-charge.
          setError('Network problem. Check your connection and try again.');
        }
        return null;
      } finally {
        inFlight.current = false;
        setPaying(false);
      }
    },
    [engagementId],
  );

  return {
    paying,
    payment,
    error,
    succeeded: payment?.status === 'succeeded',
    pay,
    clearError: () => setError(null),
  };
}
