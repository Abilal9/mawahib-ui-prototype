/**
 * Persisted password-recovery lock.
 * A recovery session is not ordinary app auth.
 * Never store an OTP, a password, or Supabase tokens here.
 */
export type RecoveryPhase = 'verifying' | 'recovery-session';

export type RecoveryState = {
  email: string;
  phase: RecoveryPhase;
  /** Set only after the recovery OTP proves this Supabase user. */
  userId?: string;
};

const STORAGE_KEY = 'mawahib.passwordRecovery.v1';

export const RECOVERY_REQUEST_COPY =
  "If an account exists for that email, we'll send a reset code. You can request another in 60 seconds.";

export function normalizeRecoveryEmail(email: string): string {
  return email.trim().toLowerCase();
}

function storageAvailable(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function isPhase(value: unknown): value is RecoveryPhase {
  return value === 'verifying' || value === 'recovery-session';
}

/** Present when storage exists but cannot be trusted. Never a real account email. */
const UNREADABLE_RECOVERY: RecoveryState = {
  email: '*',
  phase: 'verifying',
};

export function loadRecoveryState(): RecoveryState | null {
  if (!storageAvailable()) return null;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // A storage read failure stays locked so a recovery session cannot hydrate.
    return { ...UNREADABLE_RECOVERY };
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<RecoveryState>;
    if (typeof parsed.email !== 'string' || !isPhase(parsed.phase)) {
      return { ...UNREADABLE_RECOVERY };
    }
    const email = normalizeRecoveryEmail(parsed.email);
    if (!email || email === UNREADABLE_RECOVERY.email) {
      return { ...UNREADABLE_RECOVERY };
    }
    const userId =
      typeof parsed.userId === 'string' && parsed.userId.trim()
        ? parsed.userId.trim()
        : undefined;
    if (parsed.phase === 'recovery-session' && !userId) {
      return { ...UNREADABLE_RECOVERY };
    }
    return {
      email,
      phase: parsed.phase,
      ...(userId ? { userId } : {}),
    };
  } catch {
    // Unreadable recovery lock stays locked so a stored session cannot hydrate.
    return { ...UNREADABLE_RECOVERY };
  }
}

export function isRecoveryLocked(): boolean {
  return loadRecoveryState() != null;
}

export function saveRecoveryState(state: RecoveryState): boolean {
  if (!storageAvailable()) return false;
  const email = normalizeRecoveryEmail(state.email);
  const payload: RecoveryState = {
    email,
    phase: state.phase,
    ...(state.userId ? { userId: state.userId } : {}),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    return false;
  }
  const saved = loadRecoveryState();
  return (
    saved?.email === payload.email &&
    saved.phase === payload.phase &&
    saved.userId === payload.userId
  );
}

export type PasswordFlowCode =
  | 'identity'
  | 'update'
  | 'current-password'
  | 'sign-out'
  | 'validation'
  | 'network'
  | 'unavailable';

export class PasswordFlowError extends Error {
  readonly code: PasswordFlowCode;

  constructor(message: string, code: PasswordFlowCode) {
    super(message);
    this.name = 'PasswordFlowError';
    this.code = code;
  }
}

export function clearRecoveryState(): void {
  if (!storageAvailable()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
