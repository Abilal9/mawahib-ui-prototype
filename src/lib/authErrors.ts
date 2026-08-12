/**
 * Map Supabase / network auth failures to short, user-facing messages.
 * Never surface tokens, stack traces, or internal paths.
 */
export function mapAuthError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!error) return fallback;

  const raw =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : typeof error === 'object' &&
            error !== null &&
            'message' in error &&
            typeof (error as { message: unknown }).message === 'string'
          ? (error as { message: string }).message
          : '';

  const message = raw.trim();
  const lower = message.toLowerCase();
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
      ? (error as { code: string }).code.toLowerCase()
      : '';

  if (
    code === 'otp_expired' ||
    lower.includes('otp_expired') ||
    lower.includes('token has expired') ||
    lower.includes('email link is invalid or has expired')
  ) {
    return 'This verification link or code has expired. Request a new one and try again.';
  }

  if (
    code === 'access_denied' ||
    lower.includes('access_denied') ||
    lower.includes('email link is invalid')
  ) {
    return 'This confirmation link is invalid or has already been used. Request a new code.';
  }

  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'Incorrect email or password.';
  }

  if (
    lower.includes('user already registered') ||
    lower.includes('already been registered') ||
    lower.includes('email address is already')
  ) {
    return 'An account with this email already exists. Try logging in instead.';
  }

  if (
    lower.includes('phone') &&
    (lower.includes('already') || lower.includes('registered') || lower.includes('exists'))
  ) {
    return 'This phone number is already registered. Try signing in or use a different number.';
  }

  if (
    lower.includes('invalid phone') ||
    lower.includes('phone number') && lower.includes('invalid') ||
    code === 'validation_failed' && lower.includes('phone')
  ) {
    return 'Enter a valid phone number including country code (e.g. +9665…).';
  }

  if (
    lower.includes('sms') ||
    lower.includes('twilio') ||
    lower.includes('phone provider') ||
    lower.includes('unsupported phone provider')
  ) {
    return 'SMS verification is not available yet. Please use email, or try again later.';
  }

  if (
    lower.includes('token') && (lower.includes('invalid') || lower.includes('otp')) ||
    lower.includes('invalid otp') ||
    lower.includes('otp has expired') ||
    code === 'otp_disabled'
  ) {
    return 'That code is incorrect or expired. Check the latest email/SMS and try again.';
  }

  if (
    lower.includes('password') &&
    (lower.includes('weak') ||
      lower.includes('least') ||
      lower.includes('characters') ||
      lower.includes('strength'))
  ) {
    return 'Password is too weak. Use at least 8 characters with upper, lower, number, and special character.';
  }

  if (lower.includes('unable to validate email') || lower.includes('invalid email')) {
    return 'Enter a valid email address.';
  }

  if (
    lower.includes('network') ||
    lower.includes('failed to fetch') ||
    lower.includes('network request failed') ||
    lower.includes('timeout')
  ) {
    return 'Network error. Check your connection and try again.';
  }

  if (lower.includes('email not confirmed') || lower.includes('email_not_confirmed')) {
    return 'Please verify your email before signing in. Check your inbox for the code.';
  }

  if (lower.includes('signup is disabled')) {
    return 'New signups are temporarily unavailable. Please try again later.';
  }

  // Prefer a short generic message over leaking provider internals.
  if (message.length > 0 && message.length < 120 && !lower.includes('http') && !lower.includes('token=')) {
    return message;
  }

  return fallback;
}

export function mapDeepLinkAuthError(params: Record<string, string | undefined>): string | null {
  const error = params.error || params.error_code || params.error_description;
  if (!error) return null;
  return mapAuthError({
    message: decodeURIComponent(String(params.error_description || params.error || '')),
    code: params.error_code || params.error,
  });
}
