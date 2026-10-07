import { apiRequest } from '../lib/apiClient';
import { createClientId } from '../lib/clientId';
import type { MockPaymentToken } from '../utils/cardValidation';

export type ApiPaymentMethod = 'apple_pay' | 'card';
export type ApiPaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export interface ApiPayment {
  id: string;
  engagementId: string;
  payerUserId: string;
  payeeUserId: string;
  /** Decimal string, e.g. "1250.00". */
  amount: string;
  currency: string;
  method: ApiPaymentMethod;
  provider: string;
  providerReference: string | null;
  status: ApiPaymentStatus;
  failureCode: string | null;
  failureMessage: string | null;
  succeededAt: string | null;
  failedAt: string | null;
  createdAt: string;
  invoice: { id: string; invoiceNumber: string; status: string } | null;
}

/**
 * Body of POST /payments. Intentionally has NO amount, currency, PAN, CVV or
 * expiry — the server always charges the engagement's chargeable total and the
 * API rejects unknown fields.
 */
export interface CreatePaymentInput {
  engagementId: string;
  method: ApiPaymentMethod;
  mockMethodToken: MockPaymentToken;
  idempotencyKey: string;
}

export function newPaymentIdempotencyKey(): string {
  return createClientId();
}

export function isPaymentSucceeded(payment: ApiPayment): boolean {
  return payment.status === 'succeeded';
}

export function isPaymentFailed(payment: ApiPayment): boolean {
  return payment.status === 'failed' || payment.status === 'cancelled';
}

export const paymentsApi = {
  /**
   * Check the returned `status`: `succeeded` starts the work, `failed` leaves
   * the job in pending_payment so the client can retry with a NEW key.
   * `pending` or `processing` means this idempotency key is still in flight —
   * refetch the same payment; do not mint a new key.
   */
  create(input: CreatePaymentInput): Promise<ApiPayment> {
    // Whitelist explicitly so nothing extra can ever be forwarded.
    const body: CreatePaymentInput = {
      engagementId: input.engagementId,
      method: input.method,
      mockMethodToken: input.mockMethodToken,
      idempotencyKey: input.idempotencyKey,
    };
    return apiRequest<ApiPayment>('/payments', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  get(id: string): Promise<ApiPayment> {
    return apiRequest<ApiPayment>(`/payments/${id}`);
  },

  /** Succeeded payment, else the latest attempt; 404 when none exists. */
  getForEngagement(engagementId: string): Promise<ApiPayment> {
    return apiRequest<ApiPayment>(`/engagements/${engagementId}/payment`);
  },
};
