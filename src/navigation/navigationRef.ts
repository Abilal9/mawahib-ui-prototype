import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateSignedOut(
  name: 'SignIn' | 'Welcome',
  params?: RootStackParamList['SignIn'] | RootStackParamList['Welcome'],
): boolean {
  if (!navigationRef.isReady()) return false;
  if (name === 'Welcome') {
    navigationRef.navigate('Welcome', params as RootStackParamList['Welcome']);
    return true;
  }
  navigationRef.navigate('SignIn', params as RootStackParamList['SignIn']);
  return true;
}

export function resetToSignedOut(
  name: 'GuestTabs' | 'SignIn' | 'ForgotPassword',
  params?: object,
): boolean {
  if (!navigationRef.isReady()) return false;
  navigationRef.reset({
    index: 0,
    routes: [{ name, params }],
  });
  return true;
}
