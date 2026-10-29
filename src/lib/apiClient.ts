import { appEnv } from '../config/env';
import {
  ApiError,
  executeAuthenticatedRequest,
  executePublicRequest,
  accessTokenSubject,
  StaleIdentityError,
  type AuthenticatedRequestInit,
  type AuthenticatedRequestPrincipal,
} from './identityFences';

export {
  ACCOUNT_SUSPENDED_CODE,
  ApiError,
  isAccountSuspendedError,
  accessTokenSubject,
  isStaleIdentityError,
  StaleIdentityError,
  type AuthenticatedRequestPrincipal,
  type GuestRequestPrincipal,
  type RequestPrincipal,
} from './identityFences';

export type ApiRequestInit = AuthenticatedRequestInit;

export type AuthRequestRuntime = {
  capturePrincipal: () => AuthenticatedRequestPrincipal | null;
  isPrincipalCurrent: (principal: AuthenticatedRequestPrincipal) => boolean;
  getAuthenticatedToken: (
    principal: AuthenticatedRequestPrincipal,
    options?: { forceRefresh?: boolean; preferredToken?: string },
  ) => Promise<string>;
  isRecoveryActive: () => boolean;
};

let authRequestRuntime: AuthRequestRuntime | null = null;

export function registerAuthRequestRuntime(
  runtime: AuthRequestRuntime | null,
): void {
  authRequestRuntime = runtime;
}

export function captureAuthenticatedPrincipal(): AuthenticatedRequestPrincipal | null {
  if (!authRequestRuntime || authRequestRuntime.isRecoveryActive()) {
    return null;
  }
  return authRequestRuntime.capturePrincipal();
}

type AccountSuspendedListener = (notice: { accessToken: string }) => void;
const accountSuspendedListeners = new Set<AccountSuspendedListener>();

/** AuthContext owns suspension state. This only reports the response. */
export function subscribeAccountSuspended(
  listener: AccountSuspendedListener,
): () => void {
  accountSuspendedListeners.add(listener);
  return () => {
    accountSuspendedListeners.delete(listener);
  };
}

function notifyAccountSuspended(accessToken: string): void {
  for (const listener of accountSuspendedListeners) {
    listener({ accessToken });
  }
}

function requireRuntime(): AuthRequestRuntime {
  if (!authRequestRuntime) {
    throw new ApiError(401, 'Not authenticated');
  }
  return authRequestRuntime;
}

/**
 * Authenticated Nest request.
 * Identity is captured from the registered auth runtime (or an explicit
 * principal). This path never reads a Supabase session.
 */
export async function apiRequest<T>(
  path: string,
  init: ApiRequestInit = {},
): Promise<T> {
  const runtime = requireRuntime();
  if (runtime.isRecoveryActive()) {
    throw new ApiError(401, 'Not authenticated');
  }
  const principal = init.principal ?? runtime.capturePrincipal();
  if (!principal) {
    throw new ApiError(401, 'Not authenticated');
  }
  if (
    init.accessToken &&
    accessTokenSubject(init.accessToken) !== principal.userId
  ) {
    throw new StaleIdentityError();
  }

  return executeAuthenticatedRequest<T>(path, init, {
    principal,
    getAuthenticatedToken: runtime.getAuthenticatedToken,
    isPrincipalCurrent: runtime.isPrincipalCurrent,
    isRecoveryActive: runtime.isRecoveryActive,
    fetch: globalThis.fetch.bind(globalThis),
    apiBaseUrl: appEnv.apiBaseUrl,
    onAccountSuspended: notifyAccountSuspended,
  });
}

/**
 * Public Nest request for future `/api/v1/public/*` Guest reads.
 * Never inspects the session or attaches Authorization.
 * Product screens must not call this in Phase A.
 */
export async function publicRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  return executePublicRequest<T>(path, init, {
    fetch: globalThis.fetch.bind(globalThis),
    apiBaseUrl: appEnv.apiBaseUrl,
  });
}
