/**
 * Process-memory signed-out reason. Never persisted.
 * A future cold start with no session is always `none` → Guest Home.
 */

export type SignedOutReason = 'none' | 'logout' | 'expired' | 'guestChosen';

let reason: SignedOutReason = 'none';
let hadAuthenticatedProduct = false;
let guestChosenInFlight = false;

export function getSignedOutReason(): SignedOutReason {
  return reason;
}

export function setSignedOutReason(next: SignedOutReason): void {
  reason = next;
}

export function markAuthenticatedProcess(): void {
  hadAuthenticatedProduct = true;
}

export function clearAuthenticatedProcess(): void {
  hadAuthenticatedProduct = false;
}

export function wasAuthenticatedProcess(): boolean {
  return hadAuthenticatedProduct;
}

export function beginGuestChosen(): void {
  guestChosenInFlight = true;
}

export function endGuestChosen(): void {
  guestChosenInFlight = false;
}

export function isGuestChosenInFlight(): boolean {
  return guestChosenInFlight;
}

export function resetSignedOutReasonForTests(): void {
  reason = 'none';
  hadAuthenticatedProduct = false;
  guestChosenInFlight = false;
}

export function signedOutDestinationName(input: {
  reason?: SignedOutReason;
  guestEnabled: boolean;
  recoveryLocked?: boolean;
}): 'GuestTabs' | 'SignIn' {
  if (input.recoveryLocked) return 'SignIn';
  const current = input.reason ?? reason;
  if (current === 'expired') return 'SignIn';
  if (input.guestEnabled && (current === 'none' || current === 'logout' || current === 'guestChosen')) {
    return 'GuestTabs';
  }
  return 'SignIn';
}
