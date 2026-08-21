/**
 * Non-sensitive pending email-verification context.
 * Persists across app/Metro restarts so abandoned signup can resume.
 * Never store passwords or OTP tokens here.
 *
 * `lastOtpRequestedAt` is set ONLY after a successful signup/resend OTP request
 * (see `otpRequested: true`). Never stamp it for email_not_confirmed alone.
 */
export type PendingSignup = {
  email: string;
  phoneE164?: string;
  displayName?: string;
  accountType?: 'talent' | 'business';
  countryCode?: string;
  locationCode?: string;
  city?: string;
  createdAt: number;
  /** Wall time of last successful OTP send/resend. Absent = no successful send recorded. */
  lastOtpRequestedAt?: number;
};

const STORAGE_KEY = 'mawahib.pendingSignup.v1';

/** How long we treat a successful OTP request as resumable without a new send. */
export const RESUMABLE_OTP_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function storageAvailable(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export type SavePendingOptions = {
  /**
   * When true, records lastOtpRequestedAt=now (successful signup/resend).
   * When false/omitted, preserves existing lastOtpRequestedAt and never invents one.
   */
  otpRequested?: boolean;
};

/**
 * Persist non-sensitive signup context.
 * Does not claim an OTP was sent unless `otpRequested: true`.
 */
export function savePendingSignup(
  pending: Omit<PendingSignup, 'createdAt' | 'lastOtpRequestedAt'> & {
    createdAt?: number;
  },
  options: SavePendingOptions = {},
): void {
  if (!storageAvailable()) return;
  const now = Date.now();
  const existing = loadPendingSignup();
  const sameEmail =
    existing?.email === pending.email.trim().toLowerCase() ? existing : null;

  let lastOtpRequestedAt: number | undefined = sameEmail?.lastOtpRequestedAt;
  if (options.otpRequested) {
    lastOtpRequestedAt = now;
  }

  const payload: PendingSignup = {
    ...pending,
    email: pending.email.trim().toLowerCase(),
    createdAt: pending.createdAt ?? sameEmail?.createdAt ?? now,
    ...(lastOtpRequestedAt !== undefined ? { lastOtpRequestedAt } : {}),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}

export function loadPendingSignup(): PendingSignup | null {
  if (!storageAvailable()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingSignup;
    if (!parsed?.email || typeof parsed.email !== 'string') return null;
    const maxAgeMs = 14 * 24 * 60 * 60 * 1000;
    if (parsed.createdAt && Date.now() - parsed.createdAt > maxAgeMs) {
      clearPendingSignup();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * True only when this email has a recorded successful OTP send/resend within the window.
 * Does NOT treat bare createdAt as proof of delivery.
 */
export function hasResumablePendingVerification(email: string): boolean {
  const pending = loadPendingSignup();
  if (!pending) return false;
  if (pending.email !== email.trim().toLowerCase()) return false;
  const at = pending.lastOtpRequestedAt;
  if (typeof at !== 'number' || !Number.isFinite(at)) return false;
  return Date.now() - at <= RESUMABLE_OTP_WINDOW_MS;
}

export function clearPendingSignup(): void {
  if (!storageAvailable()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
