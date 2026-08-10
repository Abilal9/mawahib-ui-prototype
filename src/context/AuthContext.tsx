import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { ApiError } from '../lib/apiClient';
import { supabase } from '../lib/supabase';
import { authApi, mapApiUserToUser, type ApiUser } from '../services/authApi';
import type { User } from '../data/types';

export type AccountType = 'talent' | 'business';

export interface SignUpBasics {
  name: string;
  email: string;
  city: string;
}

interface AuthContextValue {
  accountType: AccountType | null;
  setAccountType: (type: AccountType) => void;
  isSignedIn: boolean;
  session: Session | null;
  accessToken: string | null;
  apiUser: ApiUser | null;
  mappedUser: User | null;
  signUpBasics: SignUpBasics | null;
  setSignUpBasics: (basics: SignUpBasics) => void;
  authLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  /** Supabase email/password signup (may require OTP confirm). */
  registerWithEmail: (input: {
    email: string;
    password: string;
    name: string;
    city: string;
    accountType: AccountType;
  }) => Promise<{ needsEmailConfirmation: boolean }>;
  verifySignupOtp: (email: string, token: string) => Promise<void>;
  resendSignupOtp: (email: string) => Promise<void>;
  /** Idempotent Nest bootstrap + load /users/me */
  bootstrapSession: (input?: {
    accountType?: AccountType;
    displayName?: string;
    locationCity?: string;
  }) => Promise<ApiUser>;
  refreshMe: () => Promise<ApiUser>;
  signInWithEmail: (email: string, password: string) => Promise<ApiUser>;
  completeSignUp: () => void;
  signIn: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function bootstrapPayloadFromSession(
  session: Session,
  overrides?: {
    accountType?: AccountType;
    displayName?: string;
    locationCity?: string;
  },
  fallbacks?: {
    accountType?: AccountType | null;
    name?: string;
    city?: string;
  },
) {
  const meta = session.user?.user_metadata ?? {};
  const accountType =
    overrides?.accountType ||
    fallbacks?.accountType ||
    (meta.account_type as AccountType | undefined) ||
    'talent';
  const displayName =
    overrides?.displayName ||
    fallbacks?.name ||
    (meta.display_name as string | undefined) ||
    session.user?.email?.split('@')[0] ||
    'Mawahib User';
  const locationCity =
    overrides?.locationCity ||
    fallbacks?.city ||
    (meta.city as string | undefined);

  return {
    accountType,
    displayName,
    locationCity,
    email: session.user?.email,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [signUpBasics, setSignUpBasics] = useState<SignUpBasics | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [apiUser, setApiUser] = useState<ApiUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const hydrateInFlight = useRef<Promise<ApiUser | null> | null>(null);
  const accountTypeRef = useRef(accountType);
  const signUpBasicsRef = useRef(signUpBasics);
  accountTypeRef.current = accountType;
  signUpBasicsRef.current = signUpBasics;

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const clearAuthenticatedState = useCallback(() => {
    setSession(null);
    setApiUser(null);
    setIsSignedIn(false);
    setAccountType(null);
    setSignUpBasics(null);
  }, []);

  const applyApiUser = useCallback((user: ApiUser) => {
    setApiUser(user);
    setAccountType(user.accountType);
    setIsSignedIn(true);
  }, []);

  /**
   * Restore Nest user for an active Supabase session.
   * Prefer GET /users/me; bootstrap once on 404. Never treat mock data as identity.
   */
  const hydrateBackendUser = useCallback(
    async (
      active: Session | null,
      overrides?: {
        accountType?: AccountType;
        displayName?: string;
        locationCity?: string;
      },
    ): Promise<ApiUser | null> => {
      if (!active) {
        clearAuthenticatedState();
        return null;
      }

      setSession(active);

      const run = async (): Promise<ApiUser | null> => {
        try {
          let user: ApiUser;
          try {
            user = await authApi.getMe();
          } catch (err) {
            if (!(err instanceof ApiError) || err.status !== 404) {
              throw err;
            }
            user = await authApi.bootstrap(
              bootstrapPayloadFromSession(active, overrides, {
                accountType: accountTypeRef.current,
                name: signUpBasicsRef.current?.name,
                city: signUpBasicsRef.current?.city,
              }),
            );
          }
          applyApiUser(user);
          return user;
        } catch (err) {
          if (err instanceof ApiError && err.status === 401) {
            await supabase.auth.signOut();
            clearAuthenticatedState();
            return null;
          }
          const message =
            err instanceof Error ? err.message : 'Failed to restore session';
          setAuthError(message);
          // Keep Supabase session for retry, but do not enter the app without Nest user.
          setApiUser(null);
          setIsSignedIn(false);
          return null;
        }
      };

      if (hydrateInFlight.current) {
        return hydrateInFlight.current;
      }
      const promise = run().finally(() => {
        if (hydrateInFlight.current === promise) {
          hydrateInFlight.current = null;
        }
      });
      hydrateInFlight.current = promise;
      return promise;
    },
    [applyApiUser, clearAuthenticatedState],
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        await hydrateBackendUser(data.session);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        clearAuthenticatedState();
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        setSession(next);
        return;
      }

      if (event === 'SIGNED_IN' && next) {
        // Explicit sign-in / OTP paths also call hydrate; coalesced via hydrateInFlight.
        void hydrateBackendUser(next);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [clearAuthenticatedState, hydrateBackendUser]);

  const registerWithEmail = useCallback(
    async (input: {
      email: string;
      password: string;
      name: string;
      city: string;
      accountType: AccountType;
    }) => {
      setAuthError(null);
      const { data, error } = await supabase.auth.signUp({
        email: input.email.trim(),
        password: input.password,
        options: {
          data: {
            display_name: input.name.trim(),
            city: input.city.trim(),
            account_type: input.accountType,
          },
        },
      });
      if (error) {
        setAuthError(error.message);
        throw error;
      }
      setAccountType(input.accountType);
      setSignUpBasics({
        name: input.name.trim(),
        email: input.email.trim(),
        city: input.city.trim(),
      });
      if (data.session) {
        await hydrateBackendUser(data.session, {
          accountType: input.accountType,
          displayName: input.name.trim(),
          locationCity: input.city.trim(),
        });
      }
      return { needsEmailConfirmation: !data.session };
    },
    [hydrateBackendUser],
  );

  const verifySignupOtp = useCallback(
    async (email: string, token: string) => {
      setAuthError(null);
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: 'signup',
      });
      if (error) {
        setAuthError(error.message);
        throw error;
      }
      if (data.session) {
        await hydrateBackendUser(data.session);
      }
    },
    [hydrateBackendUser],
  );

  const resendSignupOtp = useCallback(async (email: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
    });
    if (error) {
      setAuthError(error.message);
      throw error;
    }
  }, []);

  const bootstrapSession = useCallback(
    async (input?: {
      accountType?: AccountType;
      displayName?: string;
      locationCity?: string;
    }) => {
      setAuthError(null);
      const { data: sessionData } = await supabase.auth.getSession();
      const active = sessionData.session;
      if (!active) {
        throw new Error('No active session — sign in again');
      }
      const user = await hydrateBackendUser(active, input);
      if (!user) {
        throw new Error('Failed to bootstrap session');
      }
      return user;
    },
    [hydrateBackendUser],
  );

  const refreshMe = useCallback(async () => {
    const user = await authApi.getMe();
    applyApiUser(user);
    return user;
  }, [applyApiUser]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      setAuthError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setAuthError(error.message);
        throw error;
      }
      const user = await hydrateBackendUser(data.session);
      if (!user) {
        throw new Error('Signed in but failed to load profile');
      }
      return user;
    },
    [hydrateBackendUser],
  );

  const completeSignUp = useCallback(() => {
    setIsSignedIn(Boolean(apiUser));
  }, [apiUser]);

  const signIn = useCallback(() => {
    setIsSignedIn(Boolean(apiUser));
  }, [apiUser]);

  const signOut = useCallback(async () => {
    setAuthError(null);
    await supabase.auth.signOut();
    clearAuthenticatedState();
  }, [clearAuthenticatedState]);

  const value = useMemo<AuthContextValue>(
    () => ({
      accountType,
      setAccountType,
      isSignedIn: isSignedIn && Boolean(apiUser),
      session,
      accessToken: session?.access_token ?? null,
      apiUser,
      mappedUser: apiUser ? mapApiUserToUser(apiUser) : null,
      signUpBasics,
      setSignUpBasics,
      authLoading,
      authError,
      clearAuthError,
      registerWithEmail,
      verifySignupOtp,
      resendSignupOtp,
      bootstrapSession,
      refreshMe,
      signInWithEmail,
      completeSignUp,
      signIn,
      signOut,
    }),
    [
      accountType,
      isSignedIn,
      session,
      apiUser,
      signUpBasics,
      authLoading,
      authError,
      clearAuthError,
      registerWithEmail,
      verifySignupOtp,
      resendSignupOtp,
      bootstrapSession,
      refreshMe,
      signInWithEmail,
      completeSignUp,
      signIn,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
