import {
  guestIdentityId,
  shouldIgnoreStaleIdentityResult,
} from '../context/identityGuard';
import type { GuestRequestPrincipal } from './identityFences';

export type GuestFenceSnapshot = {
  principal: GuestRequestPrincipal;
  identityId: string;
  epoch: number;
};

/** Capture Guest principal at request start. Callers supply the live product-tree epoch. */
export function captureGuestRequestFence(epoch: number): GuestFenceSnapshot {
  return {
    principal: { mode: 'guest', epoch },
    identityId: guestIdentityId(epoch),
    epoch,
  };
}

/**
 * Drop a Guest result after Guest→Auth or a later signed-out epoch.
 * Do not rely on unmount alone.
 */
export function isGuestResultStale(
  started: GuestFenceSnapshot,
  now: { epoch: number; authenticatedProductActive: boolean },
): boolean {
  if (now.authenticatedProductActive) return true;
  return shouldIgnoreStaleIdentityResult({
    startedUserId: started.identityId,
    currentUserId: guestIdentityId(now.epoch),
    epochAtStart: started.epoch,
    epochNow: now.epoch,
  });
}
