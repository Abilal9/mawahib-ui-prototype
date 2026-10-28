import type { Session } from '@supabase/supabase-js';
import type { ApiUser } from '../services/authApi';

export type ColdStartDecision =
  | { kind: 'welcome' }
  | { kind: 'sign-in' }
  | { kind: 'confirm-code'; email: string }
  | { kind: 'hydrated' };

/**
 * Cold-start decision after Splash2 has waited for session restore.
 * A stored Supabase session whose Nest profile did not load is not signed out.
 * The hydrated branch is resolved by resolvePostAuthDestination in Splash2.
 */
export function resolveColdStartDestination(input: {
  recovery: boolean;
  isSignedIn: boolean;
  apiUser: ApiUser | null;
  session: Session | null;
  authError: string | null;
  pendingEmail?: string | null;
  pendingResumable?: boolean;
}): ColdStartDecision {
  if (input.recovery) {
    return { kind: 'sign-in' };
  }

  if (input.isSignedIn && input.apiUser) {
    return { kind: 'hydrated' };
  }

  // Session was kept on purpose, including when authError explains a Nest
  // failure. Do not open Welcome, Account Type, or a stale Confirm Code
  // while that session can still be retried.
  if (input.session && !input.apiUser) {
    return { kind: 'sign-in' };
  }

  if (input.pendingEmail && input.pendingResumable && !input.session) {
    return { kind: 'confirm-code', email: input.pendingEmail };
  }

  return { kind: 'welcome' };
}

/** Sign In already renders the profile-unavailable retry from this state. */
export function showsProfileRetry(input: {
  session: Session | null;
  apiUser: ApiUser | null;
  authError: string | null;
  recovery: boolean;
}): boolean {
  return Boolean(
    input.session && !input.apiUser && input.authError && !input.recovery,
  );
}
