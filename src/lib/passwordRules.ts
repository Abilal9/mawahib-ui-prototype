/**
 * Client-side password rules for Mawahib signup UX.
 * Supabase Auth password policy must be configured to at least this strength.
 */
export const PASSWORD_SPECIAL =
  /[!@#$%^&*()_+\-=[\]{};'\\:"|<>?,./`~]/;

export type PasswordRequirementId =
  | 'length'
  | 'uppercase'
  | 'lowercase'
  | 'number'
  | 'special';

export interface PasswordRequirement {
  id: PasswordRequirementId;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'At least 8 characters',
    test: (p) => p.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'One uppercase letter',
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: 'lowercase',
    label: 'One lowercase letter',
    test: (p) => /[a-z]/.test(p),
  },
  {
    id: 'number',
    label: 'One number',
    test: (p) => /[0-9]/.test(p),
  },
  {
    id: 'special',
    label: 'One special character',
    test: (p) => PASSWORD_SPECIAL.test(p),
  },
];

export function evaluatePassword(password: string) {
  return PASSWORD_REQUIREMENTS.map((req) => ({
    id: req.id,
    label: req.label,
    met: req.test(password),
  }));
}

export function isPasswordValid(password: string): boolean {
  return PASSWORD_REQUIREMENTS.every((req) => req.test(password));
}

export function firstMissingPasswordRule(password: string): string | null {
  const missing = PASSWORD_REQUIREMENTS.find((req) => !req.test(password));
  return missing?.label ?? null;
}
