import { appEnv } from '../config/env';
import { supabase } from './supabase';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type ApiRequestInit = RequestInit & {
  /**
   * Prefer the known access token from a just-created Supabase session.
   * Avoids a race where getSession() has not persisted yet after signIn.
   */
  accessToken?: string;
};

async function authHeader(
  accessToken?: string,
): Promise<Record<string, string>> {
  if (accessToken) {
    return { Authorization: `Bearer ${accessToken}` };
  }
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new ApiError(401, 'Not authenticated');
  }
  return { Authorization: `Bearer ${token}` };
}

export async function apiRequest<T>(
  path: string,
  init: ApiRequestInit = {},
): Promise<T> {
  const { accessToken, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set('Content-Type', 'application/json');
  const auth = await authHeader(accessToken);
  Object.entries(auth).forEach(([k, v]) => headers.set(k, v));

  // Paths must be root-relative (e.g. `/users/me`). Base already includes `/api/v1`.
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const res = await fetch(`${appEnv.apiBaseUrl}${normalizedPath}`, {
    ...rest,
    headers,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) message = body.message.join(', ');
      else if (body.message) message = body.message;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}
