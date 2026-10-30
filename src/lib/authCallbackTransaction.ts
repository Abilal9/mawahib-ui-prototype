/**
 * Armed signup/recovery callback transaction.
 * Email alone is not authorization. Logout invalidates the arm.
 * Fingerprints are one-shot: a URL seen before arm cannot be resurrected.
 *
 * No local imports so Node selftests can execute this module.
 */

export type AuthCallbackFlow = 'signup' | 'recovery';

export type AuthCallbackArm = {
  flow: AuthCallbackFlow;
  expectedEmail: string;
  epochAtArm: number;
  armedAt: number;
  consumed: boolean;
};

let epoch = 0;
let arm: AuthCallbackArm | null = null;
const fingerprints = new Map<string, 'consumed' | 'rejected'>();
let inflightCommit: { epoch: number; email: string | null } | null = null;

export function getAuthCallbackEpoch(): number {
  return epoch;
}

export function getAuthCallbackArm(): AuthCallbackArm | null {
  return arm;
}

export function invalidateAuthCallbacks(): void {
  epoch += 1;
  arm = null;
}

export function beginCallbackSessionCommit(
  expectedEpoch: number,
  email?: string | null,
): void {
  inflightCommit = {
    epoch: expectedEpoch,
    email: email?.trim().toLowerCase() || null,
  };
}

export function endCallbackSessionCommit(): void {
  inflightCommit = null;
}

export function isCallbackSessionCommitInFlight(): boolean {
  return inflightCommit != null;
}

export function isCallbackSessionCommitStale(): boolean {
  return inflightCommit != null && inflightCommit.epoch !== epoch;
}

export function getInflightCallbackEmail(): string | null {
  return inflightCommit?.email ?? null;
}

/**
 * Ignore auth hydrate events while a callback is committing, including a
 * late event for the same email after a newer login invalidated the epoch.
 * A different identity (B) is allowed through after invalidation.
 */
export function shouldIgnoreAuthEventForCallbackCommit(
  incomingEmail?: string | null,
): boolean {
  if (!inflightCommit) return false;
  if (inflightCommit.epoch === epoch) return true;
  const expected = inflightCommit.email;
  const incoming = incomingEmail?.trim().toLowerCase() || null;
  if (expected && incoming && incoming !== expected) return false;
  return true;
}

export function armAuthCallback(input: {
  flow: AuthCallbackFlow;
  email: string;
  now?: number;
}): AuthCallbackArm {
  const email = input.email.trim().toLowerCase();
  arm = {
    flow: input.flow,
    expectedEmail: email,
    epochAtArm: epoch,
    armedAt: input.now ?? Date.now(),
    consumed: false,
  };
  return arm;
}

export function callbackFingerprint(url: string): string {
  return url.trim();
}

export function peekCallbackFingerprint(
  url: string,
): 'consumed' | 'rejected' | null {
  return fingerprints.get(callbackFingerprint(url)) ?? null;
}

export type CallbackDecision =
  | { type: 'accept'; flow: AuthCallbackFlow; email: string }
  | { type: 'reject'; reason: string };

/**
 * One-shot evaluate. Marks the fingerprint consumed/rejected before the
 * caller does any async setSession work.
 */
export function evaluateAuthCallback(input: {
  url: string;
  flow: AuthCallbackFlow | null;
  email: string | null;
}): CallbackDecision {
  const fp = callbackFingerprint(input.url);
  const prior = fingerprints.get(fp);
  if (prior) {
    return { type: 'reject', reason: `fingerprint-${prior}` };
  }

  const current = arm;
  if (
    !current ||
    current.consumed ||
    current.epochAtArm !== epoch ||
    !input.flow
  ) {
    fingerprints.set(fp, 'rejected');
    return { type: 'reject', reason: 'not-armed' };
  }

  if (current.flow !== input.flow) {
    fingerprints.set(fp, 'rejected');
    return { type: 'reject', reason: 'flow-mismatch' };
  }

  const email = input.email?.trim().toLowerCase() ?? '';
  if (!email || email !== current.expectedEmail) {
    fingerprints.set(fp, 'rejected');
    return { type: 'reject', reason: 'email-mismatch' };
  }

  fingerprints.set(fp, 'consumed');
  arm = { ...current, consumed: true };
  return { type: 'accept', flow: current.flow, email };
}

export function resetAuthCallbackForTests(): void {
  epoch = 0;
  arm = null;
  fingerprints.clear();
  inflightCommit = null;
}
