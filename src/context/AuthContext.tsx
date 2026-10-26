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
import {
  accessTokenSubject,
  ApiError,
  isAccountSuspendedError,
  subscribeAccountSuspended,
} from '../lib/apiClient';
import { AuthFailure } from '../lib/authFailure';
import { isAuthNetworkError, mapAuthError } from '../lib/authErrors';
import {
  clearPendingSignup,
  loadPendingSignup,
  savePendingSignup,
} from '../lib/pendingSignup';
import { isPasswordValid } from '../lib/passwordRules';
import {
  clearRecoveryState,
  loadRecoveryState,
  normalizeRecoveryEmail,
  PasswordFlowError,
  saveRecoveryState,
  type RecoveryState,
} from '../lib/recoveryState';
import { shouldIgnoreStaleAuthResult } from './authSessionGuard';
import { supabase } from '../lib/supabase';
import { appEnv } from '../config/env';
import { authApi, mapApiUserToUser, type ApiUser } from '../services/authApi';
import type { User } from '../data/types';
import {
  locationDisplayFields,
  type CountryCode,
} from '../data/location/geo';

export type AccountType = 'talent' | 'business';

export interface SignUpBasics {
  name: string;
  email: string;
  city: string;
  countryCode?: CountryCode;
  locationCode?: string;
  phoneE164: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Signup outcomes — ConfirmCode only for otp_sent (send/resend actually succeeded).
 * Uses Supabase obfuscation signal: confirmed duplicate → user.identities === [].
 */
export type RegisterEmailResult =
  | { status: 'otp_sent'; kind: 'fresh' | 'resumed' }
  | { status: 'session_ready'; user: ApiUser }
  | { status: 'already_verified' }
  | { status: 'ambiguous' };

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
  /** Backend says this Supabase session's Mawahib account is suspended. */
  accountSuspended: boolean;
  /** Run normal hydration once. Backend decides whether the flag clears. */
  recheckAccountStatus: () => Promise<void>;
  /** Supabase email/password signup (email OTP confirmation required). */
  registerWithEmail: (input: {
    email: string;
    password: string;
    name: string;
    firstName?: string;
    lastName?: string;
    city: string;
    countryCode?: CountryCode;
    locationCode?: string;
    phoneE164: string;
    accountType: AccountType;
  }) => Promise<RegisterEmailResult>;
  verifySignupOtp: (email: string, token: string) => Promise<ApiUser>;
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
    locationCountry?: string;
    countryCode?: CountryCode;
    locationCode?: string;
    phoneE164?: string;
  }) => Promise<ApiUser>;
  refreshMe: () => Promise<ApiUser>;
  signInWithEmail: (email: string, password: string) => Promise<ApiUser>;
  /** Resume verification for an unverified email (resend + pending context). */
  resumeEmailVerification: (email: string) => Promise<void>;
  completeSignUp: () => void;
  signIn: () => void;
  signOut: () => Promise<void>;
  /** Set while a password-recovery lock is persisted. Not ordinary app auth. */
  recovery: RecoveryState | null;
  armRecoveryVerification: (email: string) => boolean;
  /** True after this launch discarded an interrupted recovery. */
  recoveryRestart: boolean;
  commitRecoverySession: (email: string, userId: string) => boolean;
  clearRecoveryLock: () => void;
  /** Local sign-out, then clear the lock only after that sign-out succeeds. */
  discardInterruptedRecovery: () => Promise<boolean>;
  completePasswordReset: (password: string) => Promise<
    | { status: 'signed-out' }
    | { status: 'sign-out-failed' }
    | { status: 'rejected' }
  >;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<{ otherSessionsRevoked: boolean }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function uncertainPasswordChange(): PasswordFlowError {
  return new PasswordFlowError(
    'We could not confirm whether the password changed. Try the new password before trying again.',
    'network',
  );
}

async function updatePassword(password: string): Promise<void> {
  try {
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) return;
    if (isAuthNetworkError(error)) throw uncertainPasswordChange();
    throw new PasswordFlowError(mapAuthError(error), 'update');
  } catch (err) {
    if (err instanceof PasswordFlowError) throw err;
    throw uncertainPasswordChange();
  }
}

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
    locationCountry?: string;
    countryCode?: CountryCode;
    locationCode?: string;
    phoneE164?: string;
  },
  fallbacks?: {
    accountType?: AccountType | null;
    name?: string;
    city?: string;
    countryCode?: CountryCode;
    locationCode?: string;
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
  const locationCountry =
    overrides?.locationCountry ||
    (meta.location_country as string | undefined);
  const countryCode =
    overrides?.countryCode ||
    fallbacks?.countryCode ||
    (meta.country_code as CountryCode | undefined);
  const locationCode =
    overrides?.locationCode ||
    fallbacks?.locationCode ||
    (meta.location_code as string | undefined);
  const phoneE164 =
    overrides?.phoneE164 ||
    fallbacks?.phoneE164 ||
    (meta.phone_e164 as string | undefined) ||
    session.user?.phone ||
    undefined;

  // Verification flags are server-authoritative — do not send from client.
  return {
    accountType,
    displayName,
    locationCity,
    locationCountry,
    countryCode,
    locationCode,
    email: session.user?.email,
    phoneE164,
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
  const [accountSuspended, setAccountSuspended] = useState(false);
  const [recovery, setRecovery] = useState<RecoveryState | null>(null);
  const [recoveryRestart, setRecoveryRestart] = useState(false);
  type HydrateOverrides = {
    accountType?: AccountType;
    displayName?: string;
    locationCity?: string;
    locationCountry?: string;
    countryCode?: CountryCode;
    locationCode?: string;
    phoneE164?: string;
  };

  const hydrateInFlight = useRef<Promise<ApiUser | null> | null>(null);
  const authEpoch = useRef(0);
  const hydrateSessionRef = useRef<Session | null>(null);
  const hydrateOverridesRef = useRef<HydrateOverrides | undefined>(undefined);
  const lastHydrateErrorRef = useRef<string | null>(null);
  const accountSuspendedRef = useRef(false);
  const suspensionEpoch = useRef(0);
  const accountTypeRef = useRef(accountType);
  const signUpBasicsRef = useRef(signUpBasics);
  const apiUserRef = useRef(apiUser);
  const suppressSameUserHydrateRef = useRef(false);
  accountTypeRef.current = accountType;
  signUpBasicsRef.current = signUpBasics;
  apiUserRef.current = apiUser;

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const clearRecoveryLock = useCallback(() => {
    clearRecoveryState();
    setRecovery(null);
  }, []);

  const armRecoveryVerification = useCallback((email: string) => {
    const next: RecoveryState = {
      email: normalizeRecoveryEmail(email),
      phase: 'verifying',
    };
    if (!saveRecoveryState(next)) return false;
    setRecovery(next);
    return true;
  }, []);

  const commitRecoverySession = useCallback((email: string, userId: string) => {
    const normalized = normalizeRecoveryEmail(email);
    const current = loadRecoveryState();
    if (
      !current ||
      current.phase !== 'verifying' ||
      current.email !== normalized ||
      !userId.trim()
    ) {
      return false;
    }
    const next: RecoveryState = {
      email: normalized,
      phase: 'recovery-session',
      userId: userId.trim(),
    };
    if (!saveRecoveryState(next)) return false;
    setRecovery(next);
    return true;
  }, []);

  const clearAuthenticatedState = useCallback(() => {
    authEpoch.current += 1;
    hydrateSessionRef.current = null;
    hydrateOverridesRef.current = undefined;
    accountSuspendedRef.current = false;
    setAccountSuspended(false);
    setSession(null);
    setApiUser(null);
    setIsSignedIn(false);
    setAccountType(null);
    setSignUpBasics(null);
  }, []);

  const discardInterruptedRecovery = useCallback(async () => {
    const existing = loadRecoveryState();
    if (!existing) {
      setRecovery(null);
      return true;
    }
    setRecovery(existing);
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) return false;
    clearRecoveryState();
    setRecovery(null);
    clearAuthenticatedState();
    return true;
  }, [clearAuthenticatedState]);

  const applyApiUser = useCallback((user: ApiUser) => {
    accountSuspendedRef.current = false;
    setAccountSuspended(false);
    setApiUser(user);
    setAccountType(user.accountType);
    setIsSignedIn(true);
  }, []);

  const markAccountSuspended = useCallback(() => {
    suspensionEpoch.current += 1;
    accountSuspendedRef.current = true;
    setAccountSuspended(true);
    setAuthError(null);
    lastHydrateErrorRef.current = null;
    setApiUser(null);
    setIsSignedIn(false);
  }, []);

  const sameLiveSubject = (requestToken: string, liveToken: string | null) => {
    if (!liveToken) return false;
    const requestSubject = accessTokenSubject(requestToken);
    const liveSubject = accessTokenSubject(liveToken);
    return Boolean(
      requestSubject && liveSubject && requestSubject === liveSubject,
    );
  };

  useEffect(() => {
    return subscribeAccountSuspended(({ accessToken }) => {
      if (loadRecoveryState()) return;
      const current = hydrateSessionRef.current?.access_token;
      if (!current || !sameLiveSubject(accessToken, current)) return;
      markAccountSuspended();
    });
  }, [markAccountSuspended]);

  const mergeHydrateOverrides = (
    base: HydrateOverrides | undefined,
    next: HydrateOverrides | undefined,
  ): HydrateOverrides | undefined => {
    if (!base && !next) return undefined;
    if (!next) return base;
    if (!base) return next;
    const merged: HydrateOverrides = { ...base };
    (Object.keys(next) as (keyof HydrateOverrides)[]).forEach((key) => {
      if (next[key] !== undefined) {
        (merged as Record<string, unknown>)[key] = next[key];
      }
    });
    return merged;
  };

  /**
   * Restore Nest user for an active Supabase session.
   * Prefer GET /users/me; bootstrap once on 404. Never treat mock data as identity.
   * Nest syncs emailVerified / phoneVerified from Supabase Auth (not client).
   *
   * Concurrent calls coalesce: later overrides merge into the in-flight work and
   * a follow-up pass runs if new overrides arrived mid-flight (no silent drop).
   *
   * Nest/network failures (non-401) keep the Supabase session, clear Nest identity,
   * and surface authError — MainTabs stays gated on apiUser.
   */
  const hydrateBackendUser = useCallback(
    async (
      active: Session | null,
      overrides?: HydrateOverrides,
    ): Promise<ApiUser | null> => {
      if (loadRecoveryState()) return null;
      if (!active) {
        hydrateSessionRef.current = null;
        hydrateOverridesRef.current = undefined;
        clearAuthenticatedState();
        return null;
      }

      hydrateSessionRef.current = active;
      hydrateOverridesRef.current = mergeHydrateOverrides(
        hydrateOverridesRef.current,
        overrides,
      );
      setSession(active);

      const runOnce = async (
        sessionSnap: Session,
        overridesSnap: HydrateOverrides | undefined,
      ): Promise<ApiUser | null> => {
        if (loadRecoveryState()) return null;
        const accessToken = sessionSnap.access_token;
        const epochAtStart = authEpoch.current;
        const suspensionAtStart = suspensionEpoch.current;
        const isStale = (liveToken: string | null) =>
          shouldIgnoreStaleAuthResult({
            epochAtStart,
            epochNow: authEpoch.current,
            requestToken: accessToken,
            trackedToken: hydrateSessionRef.current?.access_token ?? null,
            liveToken,
          });
        try {
          let user: ApiUser;
          try {
            user = await authApi.getMe(accessToken);
          } catch (err) {
            if (isAccountSuspendedError(err)) {
              throw err;
            }
            if (!(err instanceof ApiError) || err.status !== 404) {
              throw err;
            }
            user = await authApi.bootstrap(
              bootstrapPayloadFromSession(sessionSnap, overridesSnap, {
                accountType: accountTypeRef.current,
                name: signUpBasicsRef.current?.name,
                city: signUpBasicsRef.current?.city,
                countryCode: signUpBasicsRef.current?.countryCode,
                locationCode: signUpBasicsRef.current?.locationCode,
                phoneE164: signUpBasicsRef.current?.phoneE164,
              }),
              accessToken,
            );
          }
          lastHydrateErrorRef.current = null;
          if (loadRecoveryState()) return null;
          if (isStale(hydrateSessionRef.current?.access_token ?? null)) return null;
          // A 403 observed while this request was in flight is newer than this success.
          if (suspensionEpoch.current !== suspensionAtStart) return null;
          applyApiUser(user);
          if (isEmailConfirmed(sessionSnap) && user.emailVerified) {
            clearPendingSignup();
          }
          return user;
        } catch (err) {
          const { data: live } = await supabase.auth.getSession();
          const liveToken = live.session?.access_token ?? null;
          if (isStale(liveToken)) {
            if (live.session && liveToken && liveToken !== accessToken) {
              hydrateSessionRef.current = live.session;
            }
            return null;
          }
          if (isAccountSuspendedError(err)) {
            if (
              epochAtStart === authEpoch.current &&
              sameLiveSubject(accessToken, liveToken)
            ) {
              markAccountSuspended();
            }
            return null;
          }
          if (err instanceof ApiError && err.status === 401) {
            await supabase.auth.signOut({ scope: 'local' });
            clearAuthenticatedState();
            lastHydrateErrorRef.current = err.message;
            return null;
          }
          // Keep Supabase session; Nest profile unavailable (5xx / network / down).
          const message =
            err instanceof Error ? err.message : 'Failed to restore session';
          lastHydrateErrorRef.current = message;
          setAuthError(message);
          setApiUser(null);
          setIsSignedIn(false);
          return null;
        }
      };

      const runCoalesced = async (): Promise<ApiUser | null> => {
        let last: ApiUser | null = null;
        for (;;) {
          const sessionSnap = hydrateSessionRef.current;
          if (!sessionSnap) {
            clearAuthenticatedState();
            return null;
          }
          const tokenAtStart = sessionSnap.access_token;
          const overridesSnap = hydrateOverridesRef.current;
          hydrateOverridesRef.current = undefined;
          last = await runOnce(sessionSnap, overridesSnap);

          const overridesPending =
            hydrateOverridesRef.current !== undefined;
          const sessionChanged =
            hydrateSessionRef.current?.access_token !== tokenAtStart;
          // Another caller queued bootstrap metadata — run again with merged data.
          if (overridesPending) continue;
          // Newer session arrived mid-flight without overrides: re-run once if hydrate failed.
          if (sessionChanged && !last) continue;
          return last;
        }
      };

      if (hydrateInFlight.current) {
        return hydrateInFlight.current;
      }
      const promise = runCoalesced().finally(() => {
        if (hydrateInFlight.current === promise) {
          hydrateInFlight.current = null;
        }
      });
      hydrateInFlight.current = promise;
      return promise;
    },
    [applyApiUser, clearAuthenticatedState, markAccountSuspended],
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const pending = loadPendingSignup();
        if (pending && mounted) {
          setSignUpBasics({
            name: pending.displayName || '',
            email: pending.email,
            city: pending.city || '',
            countryCode: pending.countryCode as CountryCode | undefined,
            locationCode: pending.locationCode,
            phoneE164: pending.phoneE164 || '',
          });
          if (pending.accountType) {
            setAccountType(pending.accountType);
          }
        }
        if (loadRecoveryState()) {
          const discarded = await discardInterruptedRecovery();
          if (discarded && mounted) setRecoveryRestart(true);
        } else {
          const { data } = await supabase.auth.getSession();
          if (!mounted) return;
          await hydrateBackendUser(data.session);
        }
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

      // Recovery OTP emits this instead of SIGNED_IN. Never hydrate it.
      if (event === 'PASSWORD_RECOVERY') {
        return;
      }

      if (loadRecoveryState()) {
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        setSession(next);
        if (next) hydrateSessionRef.current = next;
        return;
      }

      if (event === 'SIGNED_IN' && next) {
        // Change-password reauth emits SIGNED_IN for the current account.
        // Hydrating here can clear apiUser on a Nest failure and reset to Sign In.
        if (suppressSameUserHydrateRef.current) {
          if (
            apiUserRef.current?.id &&
            next.user?.id === apiUserRef.current.id
          ) {
            setSession(next);
            hydrateSessionRef.current = next;
          }
          return;
        }
        void hydrateBackendUser(next);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [clearAuthenticatedState, discardInterruptedRecovery, hydrateBackendUser]);

  const resendSignupOtp = useCallback(async (email: string) => {
    setAuthError(null);
    const normalized = email.trim().toLowerCase();
    // ResendParams still use type: 'signup' for email confirmation resend.
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: normalized,
    });
    if (error) {
      const message = mapAuthError(error);
      setAuthError(message);
      throw new Error(message);
    }
    // OTP was actually requested — stamp lastOtpRequestedAt.
    savePendingSignup(
      {
        email: normalized,
        phoneE164: signUpBasicsRef.current?.phoneE164,
        displayName: signUpBasicsRef.current?.name,
        accountType: accountTypeRef.current || undefined,
        countryCode: signUpBasicsRef.current?.countryCode,
        locationCode: signUpBasicsRef.current?.locationCode,
        city: signUpBasicsRef.current?.city,
      },
      { otpRequested: true },
    );
  }, []);

  const resumeEmailVerification = useCallback(
    async (email: string) => {
      await resendSignupOtp(email.trim().toLowerCase());
    },
    [resendSignupOtp],
  );

  const registerWithEmail = useCallback(
    async (input: {
      email: string;
      password: string;
      name: string;
      firstName?: string;
      lastName?: string;
      city: string;
      countryCode?: CountryCode;
      locationCode?: string;
      phoneE164: string;
      accountType: AccountType;
    }): Promise<RegisterEmailResult> => {
      setAuthError(null);
      if (!isPasswordValid(input.password)) {
        const message =
          'Password must be at least 8 characters and include upper, lower, number, and special character.';
        setAuthError(message);
        throw new Error(message);
      }

      const basics: SignUpBasics = {
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        city: input.city.trim(),
        countryCode: input.countryCode,
        locationCode: input.locationCode,
        phoneE164: input.phoneE164,
        firstName: input.firstName?.trim(),
        lastName: input.lastName?.trim(),
      };

      // OTP-first: do not set emailRedirectTo — confirmation links are fallback only.
      const { data, error } = await supabase.auth.signUp({
        email: basics.email,
        password: input.password,
        options: {
          data: {
            display_name: basics.name,
            first_name: basics.firstName || undefined,
            last_name: basics.lastName || undefined,
            city: basics.city,
            country_code: input.countryCode,
            location_code: input.locationCode,
            account_type: input.accountType,
            phone_e164: input.phoneE164,
          },
        },
      });

      if (error) {
        const lower = error.message.toLowerCase();
        const code =
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          typeof (error as { code?: string }).code === 'string'
            ? (error as { code: string }).code.toLowerCase()
            : '';
        const already =
          code === 'user_already_exists' ||
          code === 'email_exists' ||
          lower.includes('already registered') ||
          lower.includes('already been registered') ||
          lower.includes('user already registered') ||
          lower.includes('email address is already');

        if (already) {
          // Do not claim an OTP was sent. Offer Login / Continue Verification / Change Email.
          setAccountType(input.accountType);
          setSignUpBasics(basics);
          return { status: 'ambiguous' };
        }
        const message = mapAuthError(error);
        setAuthError(message);
        throw new Error(message);
      }

      // Supabase anti-enumeration: existing *confirmed* email → fake user, identities: [].
      // No confirmation email is sent in this case — do not open ConfirmCode.
      const identities = data.user?.identities ?? null;
      if (data.user && Array.isArray(identities) && identities.length === 0) {
        setAccountType(input.accountType);
        setSignUpBasics(basics);
        return { status: 'already_verified' };
      }

      setAccountType(input.accountType);
      setSignUpBasics(basics);

      if (data.session) {
        const fields =
          input.countryCode && input.locationCode
            ? locationDisplayFields(input.countryCode, input.locationCode)
            : null;
        const user = await hydrateBackendUser(data.session, {
          accountType: input.accountType,
          displayName: basics.name,
          locationCity: fields?.locationCity ?? basics.city,
          locationCountry: fields?.locationCountry,
          countryCode: fields?.countryCode ?? input.countryCode,
          locationCode: fields?.locationCode ?? input.locationCode,
          phoneE164: input.phoneE164,
        });
        if (!user) {
          if (accountSuspendedRef.current) {
            throw new AuthFailure(
              'account_suspended',
              'This account is suspended.',
            );
          }
          const detail =
            lastHydrateErrorRef.current || 'Nest /users/me or bootstrap failed';
          const message = `Signed up but failed to load profile: ${detail}`;
          setAuthError(message);
          throw new AuthFailure('backend_hydration', message, detail);
        }
        clearPendingSignup();
        return { status: 'session_ready', user };
      }

      if (!data.user) {
        const message =
          'Could not start signup. Try again or use a different email.';
        setAuthError(message);
        throw new Error(message);
      }

      // Fresh signup (or unverified identity returned with identities) — OTP email sent.
      savePendingSignup(
        {
          email: basics.email,
          phoneE164: basics.phoneE164,
          displayName: basics.name,
          accountType: input.accountType,
          countryCode: input.countryCode,
          locationCode: input.locationCode,
          city: basics.city,
        },
        { otpRequested: true },
      );
      return { status: 'otp_sent', kind: 'fresh' };
    },
    [hydrateBackendUser],
  );

  const verifySignupOtp = useCallback(
    async (email: string, token: string) => {
      setAuthError(null);
      // Installed @supabase/supabase-js: EmailOtpType includes 'email' and deprecated 'signup'.
      // Prefer 'email' for signup OTP verification (current SDK guidance).
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: 'email',
      });
      if (error) {
        const message = mapAuthError(error);
        setAuthError(message);
        throw new AuthFailure('email_otp', message);
      }
      if (!data.session) {
        const message = 'Verification succeeded but no session was returned.';
        setAuthError(message);
        throw new AuthFailure('email_otp', message);
      }
      const user = await hydrateBackendUser(data.session);
      if (!user) {
        if (accountSuspendedRef.current) {
          throw new AuthFailure(
            'account_suspended',
            'This account is suspended.',
          );
        }
        const detail =
          lastHydrateErrorRef.current || 'Nest /users/me or bootstrap failed';
        const message = `Email verified but failed to load profile: ${detail}`;
        setAuthError(message);
        throw new AuthFailure('backend_hydration', message, detail);
      }
      clearPendingSignup();
      return user;
    },
    [hydrateBackendUser],
  );

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
        throw new AuthFailure('phone_otp', message);
      }
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone.trim(),
        token: token.trim(),
        type: 'phone_change',
      });
      if (error) {
        const message = mapAuthError(error);
        setAuthError(message);
        throw new AuthFailure('phone_otp', message);
      }
      const user = await hydrateBackendUser(data.session);
      if (!user) {
        if (accountSuspendedRef.current) {
          throw new AuthFailure(
            'account_suspended',
            'This account is suspended.',
          );
        }
        const detail =
          lastHydrateErrorRef.current || 'Nest /users/me failed';
        const message = `Phone verified but failed to load profile: ${detail}`;
        setAuthError(message);
        throw new AuthFailure('backend_hydration', message, detail);
      }
      return user;
    },
    [hydrateBackendUser],
  );

  const bootstrapSession = useCallback(
    async (input?: {
      accountType?: AccountType;
      displayName?: string;
      locationCity?: string;
      locationCountry?: string;
      countryCode?: CountryCode;
      locationCode?: string;
      phoneE164?: string;
    }) => {
      if (loadRecoveryState()) {
        throw new PasswordFlowError(
          'Password reset is in progress.',
          'unavailable',
        );
      }
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
        if (accountSuspendedRef.current) {
          throw new AuthFailure(
            'account_suspended',
            'This account is suspended.',
          );
        }
        throw new AuthFailure(
          'backend_hydration',
          lastHydrateErrorRef.current || 'Failed to bootstrap session',
        );
      }
      return user;
    },
    [hydrateBackendUser],
  );

  const refreshMe = useCallback(async () => {
    if (loadRecoveryState()) {
      throw new PasswordFlowError(
        'Password reset is in progress.',
        'unavailable',
      );
    }
    const epoch = authEpoch.current;
    const suspensionAtStart = suspensionEpoch.current;
    const user = await authApi.getMe();
    if (epoch !== authEpoch.current) return user;
    if (suspensionEpoch.current !== suspensionAtStart) return user;
    applyApiUser(user);
    return user;
  }, [applyApiUser]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      setAuthError(null);
      lastHydrateErrorRef.current = null;
      if (loadRecoveryState()) {
        throw new PasswordFlowError(
          'Password reset is in progress.',
          'unavailable',
        );
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        const lower = error.message.toLowerCase();
        if (
          lower.includes('email not confirmed') ||
          lower.includes('email_not_confirmed')
        ) {
          // Do NOT stamp lastOtpRequestedAt — no OTP was sent by this failure.
          // SignInScreen may attempt a legitimate resend before ConfirmCode.
          const message = mapAuthError(error);
          setAuthError(message);
          const err = new Error(message) as Error & {
            code?: string;
            needsEmailConfirmation?: boolean;
          };
          err.code = 'email_not_confirmed';
          err.needsEmailConfirmation = true;
          throw err;
        }
        const message = mapAuthError(error);
        setAuthError(message);
        throw new Error(message);
      }
      if (!data.session?.access_token) {
        const message = 'Signed in but no session token was returned';
        setAuthError(message);
        throw new Error(message);
      }
      const user = await hydrateBackendUser(data.session);
      if (!user) {
        if (accountSuspendedRef.current) {
          throw new AuthFailure(
            'account_suspended',
            'This account is suspended.',
          );
        }
        const detail =
          lastHydrateErrorRef.current ||
          'Nest /users/me failed after Supabase sign-in';
        const message = `Signed in but failed to load profile: ${detail}`;
        setAuthError(message);
        throw new AuthFailure('backend_hydration', message, detail);
      }
      clearPendingSignup();
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

  const recheckAccountStatus = useCallback(async () => {
    if (loadRecoveryState()) return;
    const { data } = await supabase.auth.getSession();
    await hydrateBackendUser(data.session);
  }, [hydrateBackendUser]);

  const signOut = useCallback(async () => {
    setAuthError(null);
    // Local scope signs this device out only. The client default is global.
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
      throw new Error('Could not log out. You are still signed in on this device.');
    }
    // Keep pendingSignup so abandoned verification can resume after logout.
    clearAuthenticatedState();
  }, [clearAuthenticatedState]);

  const completePasswordReset = useCallback(
    async (password: string) => {
      if (!isPasswordValid(password)) {
        throw new PasswordFlowError(
          'Password must be at least 8 characters and include upper, lower, number, and special character.',
          'validation',
        );
      }
      const recoveryLock = loadRecoveryState();
      if (
        !recoveryLock ||
        recoveryLock.phase !== 'recovery-session' ||
        !recoveryLock.userId
      ) {
        throw new PasswordFlowError(
          'Password reset is no longer active. Request a new code.',
          'unavailable',
        );
      }
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user;
      const email = normalizeRecoveryEmail(sessionUser?.email ?? '');
      if (
        !sessionUser ||
        sessionUser.id !== recoveryLock.userId ||
        email !== recoveryLock.email
      ) {
        const { error } = await supabase.auth.signOut({ scope: 'local' });
        if (!error) {
          clearRecoveryState();
          setRecovery(null);
          clearAuthenticatedState();
        }
        return { status: 'rejected' as const };
      }
      const { error: updateError } = await (async () => {
        try {
          await updatePassword(password);
          return { error: null };
        } catch (err) {
          return { error: err };
        }
      })();
      if (updateError) throw updateError;
      try {
        const globalOut = await supabase.auth.signOut({ scope: 'global' });
        if (globalOut.error) {
          const localOut = await supabase.auth.signOut({ scope: 'local' });
          if (localOut.error) {
            return { status: 'sign-out-failed' as const };
          }
        }
      } catch {
        try {
          const localOut = await supabase.auth.signOut({ scope: 'local' });
          if (localOut.error) {
            return { status: 'sign-out-failed' as const };
          }
        } catch {
          return { status: 'sign-out-failed' as const };
        }
      }
      clearRecoveryState();
      setRecovery(null);
      clearAuthenticatedState();
      return { status: 'signed-out' as const };
    },
    [clearAuthenticatedState],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (loadRecoveryState()) {
        throw new PasswordFlowError(
          'Finish or cancel password reset before changing your password.',
          'unavailable',
        );
      }
      if (!isPasswordValid(newPassword)) {
        throw new PasswordFlowError(
          'Password must be at least 8 characters and include upper, lower, number, and special character.',
          'validation',
        );
      }
      const { data: before } = await supabase.auth.getSession();
      const original = before.session?.user;
      const email = normalizeRecoveryEmail(original?.email ?? '');
      if (!original || !email) {
        throw new PasswordFlowError(
          'Sign in again before changing your password.',
          'unavailable',
        );
      }
      suppressSameUserHydrateRef.current = true;
      let data: Awaited<
        ReturnType<typeof supabase.auth.signInWithPassword>
      >['data'];
      let error: Awaited<
        ReturnType<typeof supabase.auth.signInWithPassword>
      >['error'];
      try {
        const signedIn = await supabase.auth.signInWithPassword({
          email,
          password: currentPassword,
        });
        data = signedIn.data;
        error = signedIn.error;
      } finally {
        suppressSameUserHydrateRef.current = false;
      }
      if (error) {
        const lower = error.message.toLowerCase();
        if (
          lower.includes('invalid login') ||
          lower.includes('invalid credentials')
        ) {
          throw new PasswordFlowError(
            'Current password is incorrect.',
            'current-password',
          );
        }
        if (
          lower.includes('network') ||
          lower.includes('failed to fetch') ||
          lower.includes('network request failed')
        ) {
          throw new PasswordFlowError(
            'Network error. Check your connection and try again.',
            'network',
          );
        }
        throw new PasswordFlowError(mapAuthError(error), 'current-password');
      }
      const signedInId = data.user?.id;
      const signedInEmail = normalizeRecoveryEmail(data.user?.email ?? '');
      const { data: afterSignIn } = await supabase.auth.getSession();
      const currentId = afterSignIn.session?.user.id;
      const currentEmail = normalizeRecoveryEmail(
        afterSignIn.session?.user.email ?? '',
      );
      if (
        !signedInId ||
        signedInId !== original.id ||
        signedInEmail !== email ||
        currentId !== original.id ||
        currentEmail !== email
      ) {
        const { error: outError } = await supabase.auth.signOut({
          scope: 'local',
        });
        if (!outError) clearAuthenticatedState();
        throw new PasswordFlowError(
          'Could not confirm this account. Sign in again.',
          'identity',
        );
      }
      await updatePassword(newPassword);
      try {
        const others = await supabase.auth.signOut({ scope: 'others' });
        return { otherSessionsRevoked: !others.error };
      } catch {
        return { otherSessionsRevoked: false };
      }
    },
    [clearAuthenticatedState],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      accountType,
      setAccountType,
      isSignedIn: isSignedIn && Boolean(apiUser) && !recovery,
      session,
      accessToken: recovery ? null : (session?.access_token ?? null),
      apiUser,
      mappedUser: apiUser ? mapApiUserToUser(apiUser) : null,
      signUpBasics,
      setSignUpBasics,
      authLoading,
      authError,
      clearAuthError,
      accountSuspended,
      recheckAccountStatus,
      registerWithEmail,
      verifySignupOtp,
      resendSignupOtp,
      sendPhoneOtp,
      verifyPhoneOtp,
      bootstrapSession,
      refreshMe,
      signInWithEmail,
      resumeEmailVerification,
      completeSignUp,
      signIn,
      signOut,
      recovery,
      recoveryRestart,
      armRecoveryVerification,
      commitRecoverySession,
      clearRecoveryLock,
      discardInterruptedRecovery,
      completePasswordReset,
      changePassword,
    }),
    [
      accountType,
      isSignedIn,
      session,
      apiUser,
      recovery,
      recoveryRestart,
      signUpBasics,
      authLoading,
      authError,
      accountSuspended,
      clearAuthError,
      recheckAccountStatus,
      registerWithEmail,
      verifySignupOtp,
      resendSignupOtp,
      sendPhoneOtp,
      verifyPhoneOtp,
      bootstrapSession,
      refreshMe,
      signInWithEmail,
      resumeEmailVerification,
      completeSignUp,
      signIn,
      signOut,
      armRecoveryVerification,
      commitRecoverySession,
      clearRecoveryLock,
      discardInterruptedRecovery,
      completePasswordReset,
      changePassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
