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
import { mapAuthError } from '../lib/authErrors';
import { getAuthRedirectUrl } from '../lib/authRedirect';
import { isPasswordValid } from '../lib/passwordRules';
import { supabase } from '../lib/supabase';
import { appEnv } from '../config/env';
import { authApi, mapApiUserToUser, type ApiUser } from '../services/authApi';
import type { User } from '../data/types';

export type AccountType = 'talent' | 'business';

export interface SignUpBasics {
  name: string;
  email: string;
  city: string;
  phoneE164: string;
  firstName?: string;
  lastName?: string;
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
    firstName?: string;
    lastName?: string;
    city: string;
    phoneE164: string;
    accountType: AccountType;
  }) => Promise<{ needsEmailConfirmation: boolean }>;
  verifySignupOtp: (email: string, token: string) => Promise<void>;
  resendSignupOtp: (email: string) => Promise<void>;
  /**
   * Phone OTP on the same Supabase user (updateUser + phone_change).
   * Requires EXPO_PUBLIC_PHONE_AUTH_ENABLED and an SMS provider.
   */
  sendPhoneOtp: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<ApiUser>;
  /** Idempotent Nest bootstrap + load /users/me */
  bootstrapSession: (input?: {
    accountType?: AccountType;
    displayName?: string;
    locationCity?: string;
    phoneE164?: string;
  }) => Promise<ApiUser>;
  refreshMe: () => Promise<ApiUser>;
  signInWithEmail: (email: string, password: string) => Promise<ApiUser>;
  completeSignUp: () => void;
  signIn: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function isEmailConfirmed(session: Session): boolean {
  const user = session.user;
  return Boolean(user.email_confirmed_at || user.confirmed_at);
}

function bootstrapPayloadFromSession(
  session: Session,
  overrides?: {
    accountType?: AccountType;
    displayName?: string;
    locationCity?: string;
    phoneE164?: string;
  },
  fallbacks?: {
    accountType?: AccountType | null;
    name?: string;
    city?: string;
    phoneE164?: string;
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
  const phoneE164 =
    overrides?.phoneE164 ||
    fallbacks?.phoneE164 ||
    (meta.phone_e164 as string | undefined) ||
    session.user?.phone ||
    undefined;

  return {
    accountType,
    displayName,
    locationCity,
    email: session.user?.email,
    phoneE164,
    emailVerified: isEmailConfirmed(session),
    phoneVerified: Boolean(session.user?.phone_confirmed_at),
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
        phoneE164?: string;
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
            // Keep Nest verification flags aligned with Supabase when session confirms email/phone.
            const emailVerified = isEmailConfirmed(active);
            const phoneVerified = Boolean(active.user.phone_confirmed_at);
            if (
              (emailVerified && !user.emailVerified) ||
              (phoneVerified && !user.phoneVerified)
            ) {
              user = await authApi.updateMe({
                ...(emailVerified && !user.emailVerified
                  ? { emailVerified: true }
                  : {}),
                ...(phoneVerified && !user.phoneVerified
                  ? { phoneVerified: true }
                  : {}),
              });
            }
          } catch (err) {
            if (!(err instanceof ApiError) || err.status !== 404) {
              throw err;
            }
            user = await authApi.bootstrap(
              bootstrapPayloadFromSession(active, overrides, {
                accountType: accountTypeRef.current,
                name: signUpBasicsRef.current?.name,
                city: signUpBasicsRef.current?.city,
                phoneE164: signUpBasicsRef.current?.phoneE164,
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
      firstName?: string;
      lastName?: string;
      city: string;
      phoneE164: string;
      accountType: AccountType;
    }) => {
      setAuthError(null);
      if (!isPasswordValid(input.password)) {
        const message =
          'Password must be at least 8 characters and include upper, lower, number, and special character.';
        setAuthError(message);
        throw new Error(message);
      }
      const redirectTo = getAuthRedirectUrl();
      const { data, error } = await supabase.auth.signUp({
        email: input.email.trim(),
        password: input.password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            display_name: input.name.trim(),
            first_name: input.firstName?.trim() || undefined,
            last_name: input.lastName?.trim() || undefined,
            city: input.city.trim(),
            account_type: input.accountType,
            phone_e164: input.phoneE164,
          },
        },
      });
      if (error) {
        const message = mapAuthError(error);
        setAuthError(message);
        throw new Error(message);
      }
      setAccountType(input.accountType);
      setSignUpBasics({
        name: input.name.trim(),
        email: input.email.trim(),
        city: input.city.trim(),
        phoneE164: input.phoneE164,
        firstName: input.firstName?.trim(),
        lastName: input.lastName?.trim(),
      });
      if (data.session) {
        await hydrateBackendUser(data.session, {
          accountType: input.accountType,
          displayName: input.name.trim(),
          locationCity: input.city.trim(),
          phoneE164: input.phoneE164,
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
        const message = mapAuthError(error);
        setAuthError(message);
        throw new Error(message);
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
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
      },
    });
    if (error) {
      const message = mapAuthError(error);
      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  const sendPhoneOtp = useCallback(async (phone: string) => {
    setAuthError(null);
    if (!appEnv.phoneAuthEnabled) {
      const message =
        'SMS verification is not yet enabled. Configure a Supabase phone provider, then set EXPO_PUBLIC_PHONE_AUTH_ENABLED=true.';
      setAuthError(message);
      throw new Error(message);
    }
    const normalized = phone.trim();
    const {
      data: { session: active },
    } = await supabase.auth.getSession();
    if (!active) {
      const message =
        'Sign in and verify email first, then verify phone on the same account.';
      setAuthError(message);
      throw new Error(message);
    }
    // Attach phone to the existing Supabase user (no second auth.users row).
    const { error } = await supabase.auth.updateUser({ phone: normalized });
    if (error) {
      const message = mapAuthError(error);
      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  const verifyPhoneOtp = useCallback(
    async (phone: string, token: string) => {
      setAuthError(null);
      if (!appEnv.phoneAuthEnabled) {
        const message =
          'SMS verification is not yet enabled. Configure a Supabase phone provider first.';
        setAuthError(message);
        throw new Error(message);
      }
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone.trim(),
        token: token.trim(),
        type: 'phone_change',
      });
      if (error) {
        const message = mapAuthError(error);
        setAuthError(message);
        throw new Error(message);
      }
      const user = await hydrateBackendUser(data.session);
      if (!user) {
        throw new Error('Phone verified but failed to load profile');
      }
      if (!user.phoneVerified) {
        return authApi.updateMe({ phoneVerified: true }).then((updated) => {
          applyApiUser(updated);
          return updated;
        });
      }
      return user;
    },
    [applyApiUser, hydrateBackendUser],
  );

  const bootstrapSession = useCallback(
    async (input?: {
      accountType?: AccountType;
      displayName?: string;
      locationCity?: string;
      phoneE164?: string;
    }) => {
      setAuthError(null);
      const { data: sessionData } = await supabase.auth.getSession();
      const active = sessionData.session;
      if (!active) {
        throw new Error('No active session — sign in again');
      }
      const user = await hydrateBackendUser(active, {
        ...input,
        phoneE164: input?.phoneE164 ?? signUpBasicsRef.current?.phoneE164,
      });
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
        const message = mapAuthError(error);
        setAuthError(message);
        throw new Error(message);
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
      sendPhoneOtp,
      verifyPhoneOtp,
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
      sendPhoneOtp,
      verifyPhoneOtp,
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
