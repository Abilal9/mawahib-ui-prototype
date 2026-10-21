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
      const body = (await res.json()) as {
        message?: string | string[];
        code?: string;
        skillId?: string;
        nameEn?: string;
        categoryId?: string;
      };
      if (Array.isArray(body.message)) message = body.message.join(', ');
      else if (body.message) message = body.message;
      throw new ApiError(res.status, message, {
        code: body.code,
        skillId: body.skillId,
        nameEn: body.nameEn,
        categoryId: body.categoryId,
      });
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
