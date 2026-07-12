export const languages = [
  { id: 'en', label: 'English', nativeLabel: 'English' },
  { id: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  { id: 'fr', label: 'French', nativeLabel: 'Français' },
] as const;

export type LanguageId = (typeof languages)[number]['id'];
