export const colors = {
  primary: '#E60076',
  primaryDark: '#C6005C',
  primaryLight: '#FF4DA6',
  background: '#F7F9FB',
  white: '#FFFFFF',
  text: '#0E243A',
  textSecondary: '#627D98',
  textTertiary: '#334E68',
  border: '#D9E2EC',
  borderLight: '#EEF2F6',
  success: '#27AB83',
  warning: '#F0B429',
  error: '#E12D39',
  overlay: 'rgba(14, 36, 58, 0.5)',
  shadow: 'rgba(14, 36, 58, 0.08)',
} as const;

export type ColorName = keyof typeof colors;
