import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [signUpBasics, setSignUpBasics] = useState<SignUpBasics | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [apiUser, setApiUser] = useState<ApiUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setIsSignedIn(Boolean(data.session));
      setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setIsSignedIn(Boolean(next));
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

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
      return { needsEmailConfirmation: !data.session };
    },
    [],
  );

  const verifySignupOtp = useCallback(async (email: string, token: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'signup',
    });
    if (error) {
      setAuthError(error.message);
      throw error;
    }
  }, []);

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
      setSession(active);
      const meta = active.user?.user_metadata ?? {};
      const type =
        input?.accountType ||
        accountType ||
        (meta.account_type as AccountType | undefined) ||
        'talent';
      const displayName =
        input?.displayName ||
        signUpBasics?.name ||
        (meta.display_name as string | undefined) ||
        active.user?.email?.split('@')[0] ||
        'Mawahib User';
      const locationCity =
        input?.locationCity ||
        signUpBasics?.city ||
        (meta.city as string | undefined);

      const user = await authApi.bootstrap({
        accountType: type,
        displayName,
        locationCity,
        email: active.user?.email,
      });
      setApiUser(user);
      setAccountType(user.accountType);
      setIsSignedIn(true);
      return user;
    },
    [accountType, signUpBasics],
  );

  const refreshMe = useCallback(async () => {
    const user = await authApi.getMe();
    setApiUser(user);
    setAccountType(user.accountType);
    setIsSignedIn(true);
    return user;
  }, []);

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
      setSession(data.session);
      const meta = data.user?.user_metadata ?? {};
      const user = await authApi.bootstrap({
        accountType: (meta.account_type as AccountType) || 'talent',
        displayName:
          (meta.display_name as string) ||
          email.trim().split('@')[0] ||
          'Mawahib User',
        locationCity: (meta.city as string) || undefined,
        email: data.user?.email,
      });
      setApiUser(user);
      setAccountType(user.accountType);
      setIsSignedIn(true);
      return user;
    },
    [],
  );

  const completeSignUp = useCallback(() => {
    setIsSignedIn(true);
  }, []);

  const signIn = useCallback(() => {
    setIsSignedIn(true);
  }, []);

  const signOut = useCallback(async () => {
    setAuthError(null);
    await supabase.auth.signOut();
    setIsSignedIn(false);
    setSignUpBasics(null);
    setAccountType(null);
    setApiUser(null);
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      accountType,
      setAccountType,
      isSignedIn,
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
