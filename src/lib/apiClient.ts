import { appEnv } from '../config/env';
import { supabase } from './supabase';

export class ApiError extends Error {
  status: number;
  code?: string;
  skillId?: string;
  nameEn?: string;
  categoryId?: string;

  constructor(
    status: number,
    message: string,
    details?: {
      code?: string;
      skillId?: string;
      nameEn?: string;
      categoryId?: string;
    },
  ) {
    super(message);
    this.status = status;
    this.code = details?.code;
    this.skillId = details?.skillId;
    this.nameEn = details?.nameEn;
    this.categoryId = details?.categoryId;
  }
}

export type ApiRequestInit = RequestInit & {
  /**
   * Prefer the known access token from a just-created Supabase session.
   * Avoids a race where getSession() has not persisted yet after signIn.
   */
  accessToken?: string;
};

export const ACCOUNT_SUSPENDED_CODE = 'ACCOUNT_SUSPENDED';

export function isAccountSuspendedError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 403 &&
    error.code === ACCOUNT_SUSPENDED_CODE
  );
}

/** JWT `sub` without verifying the signature. Used only to ignore stale responses. */
export function accessTokenSubject(accessToken: string): string | null {
  const segment = accessToken.split('.')[1];
  if (!segment) return null;
  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded = globalThis.atob(padded);
    const payload = JSON.parse(decoded) as { sub?: unknown };
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
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

async function resolveAccessToken(accessToken?: string): Promise<string> {
  if (accessToken) return accessToken;
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new ApiError(401, 'Not authenticated');
  }
  return token;
}

export async function apiRequest<T>(
  path: string,
  init: ApiRequestInit = {},
): Promise<T> {
  const { accessToken, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set('Content-Type', 'application/json');
  const token = await resolveAccessToken(accessToken);
  headers.set('Authorization', `Bearer ${token}`);

  // Paths must be root-relative (e.g. `/users/me`). Base already includes `/api/v1`.
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const res = await fetch(`${appEnv.apiBaseUrl}${normalizedPath}`, {
    ...rest,
    headers,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as {
        message?: string | string[];
        code?: string;
        skillId?: string;
        nameEn?: string;
        categoryId?: string;
      };
      if (Array.isArray(body.message)) message = body.message.join(', ');
      else if (body.message) message = body.message;
      const error = new ApiError(res.status, message, {
        code: body.code,
        skillId: body.skillId,
        nameEn: body.nameEn,
        categoryId: body.categoryId,
      });
      if (isAccountSuspendedError(error)) {
        notifyAccountSuspended(token);
      }
      throw error;
    } catch (error) {
      if (error instanceof ApiError) throw error;
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}
