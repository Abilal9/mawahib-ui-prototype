/**
 * Resolves the signed-out product destination from process reason + flag.
 * Recovery and expiry never become Guest.
 */

import { isGuestBrowsingEnabled } from '../config/guestBrowsingFlag';
import {
  getActiveSignOutTransaction,
  type SignedOutInterpretation,
} from './signOutTransaction';
import {
  getSignedOutReason,
  signedOutDestinationName,
  wasAuthenticatedProcess,
} from './signedOutReason';
import type { SignedOutStackParamList } from '../navigation/types';

type SignedOutRoute = {
  name: keyof SignedOutStackParamList;
  params?: object;
};

export function resolveSignedOutDestination(input?: {
  recoveryLocked?: boolean;
  guestEnabled?: boolean;
}): SignedOutRoute {
  const txn = getActiveSignOutTransaction();
  if (txn && (txn.status === 'started' || txn.status === 'completed')) {
    if (txn.destination === 'ForgotPassword') {
      return { name: 'ForgotPassword' };
    }
    if (txn.destination === 'GuestTabs') {
      return { name: 'GuestTabs' };
    }
    return {
      name: 'SignIn',
      params: txn.notice === 'password-updated' ? { notice: 'password-updated' } : undefined,
    };
  }

  if (input?.recoveryLocked) {
    return { name: 'SignIn' };
  }

  const reason = getSignedOutReason();
  if (reason === 'expired') {
    return { name: 'SignIn', params: { notice: 'session-expired' } };
  }

  // A null user during suspension / hydrate failure is not Guest.
  // Intentional logout clears this mark, then passes an explicit destination.
  if (wasAuthenticatedProcess() && reason === 'none') {
    return { name: 'SignIn' };
  }

  const guestEnabled = input?.guestEnabled ?? isGuestBrowsingEnabled();
  if (
    signedOutDestinationName({
      reason,
      guestEnabled,
      recoveryLocked: input?.recoveryLocked,
    }) === 'GuestTabs'
  ) {
    return { name: 'GuestTabs' };
  }

  return { name: 'SignIn' };
}

export function routeFromSignedOutInterpretation(
  interpretation: SignedOutInterpretation,
): SignedOutRoute {
  if (interpretation.destination === 'ForgotPassword') {
    return { name: 'ForgotPassword' };
  }
  if (interpretation.destination === 'GuestTabs') {
    return { name: 'GuestTabs' };
  }
  return {
    name: 'SignIn',
    params:
      interpretation.notice === 'password-updated'
        ? { notice: 'password-updated' }
        : interpretation.reason === 'expired'
          ? { notice: 'session-expired' }
          : undefined,
  };
}
