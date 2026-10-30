import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  SplashScreen1,
  SplashScreen2,
  AccountSuspendedScreen,
} from '../screens';
import SignedOutNavigator from './SignedOutNavigator';
import AuthenticatedNavigator from './AuthenticatedNavigator';
import { AuthenticatedProviders } from './AuthenticatedProviders';
import {
  RootStackParamList,
  SignedOutStackParamList,
} from './types';
import { useAuth } from '../context/AuthContext';
import { loadRecoveryState } from '../lib/recoveryState';
import { hasConsumedProcessStart } from '../lib/processStart';
import {
  getProductTreeEpoch,
  isAuthenticatedProductActive,
  leaveAuthenticatedProduct,
  subscribeProductTree,
  takeSignedOutEntry,
} from '../lib/productTree';
import { isGuestBrowsingEnabled } from '../config/guestBrowsingFlag';
import { View } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();
const SplashStack = createNativeStackNavigator<
  Pick<RootStackParamList, 'Splash1' | 'Splash2'>
>();

function MediaHoldScreen() {
  return <View style={{ flex: 1, backgroundColor: '#F7F9FB' }} />;
}

function defaultSignedOutRoute(input: {
  recoveryLocked: boolean;
  hasSession: boolean;
}): keyof SignedOutStackParamList {
  if (input.recoveryLocked || input.hasSession) return 'SignIn';
  if (isGuestBrowsingEnabled()) return 'GuestTabs';
  return 'SignIn';
}

function SignedOutBranch({
  recoveryLocked,
  hasSession,
}: {
  recoveryLocked: boolean;
  hasSession: boolean;
}) {
  const [entry] = useState(() => {
    const handoff = takeSignedOutEntry();
    if (handoff) {
      return { name: handoff.name, params: handoff.params };
    }
    // Involuntary or racy sign-out can unmount the auth tree before the
    // SignIn handoff is written. Do not fall through to Guest Home.
    if (isAuthenticatedProductActive() || hasSession) {
      return { name: 'SignIn' as const };
    }
    return { name: defaultSignedOutRoute({ recoveryLocked, hasSession }) };
  });

  return (
    <SignedOutNavigator
      initialRouteName={entry.name}
      initialParams={entry.params}
    />
  );
}

export default function RootNavigator() {
  const {
    accountSuspended,
    recovery,
    mediaCacheReady,
    isSignedIn,
    apiUser,
    session,
  } = useAuth();
  useSyncExternalStore(subscribeProductTree, getProductTreeEpoch);

  useEffect(() => {
    if (!isSignedIn && isAuthenticatedProductActive()) {
      leaveAuthenticatedProduct({ name: 'SignIn' });
    }
  }, [isSignedIn]);

  const screenOptions = {
    headerShown: false,
    animation: 'slide_from_right' as const,
    contentStyle: { backgroundColor: '#F7F9FB' },
  };

  // Warm cache/identity work must not unmount the process-lifetime navigation
  // root. Hold the product stack so expo-image cannot fetch while owner is
  // unestablished.
  const processStarted = hasConsumedProcessStart();
  if (processStarted && !mediaCacheReady) {
    return (
      <Stack.Navigator
        key="media-hold"
        screenOptions={screenOptions}
        initialRouteName="SignIn"
      >
        <Stack.Screen name="SignIn" component={MediaHoldScreen} />
      </Stack.Navigator>
    );
  }

  // Recovery stays on its own screens. Suspension replaces the tree so
  // MainTabs and deep-link resets cannot race this branch.
  if (accountSuspended && !recovery) {
    return (
      <Stack.Navigator key="account-suspended" screenOptions={screenOptions}>
        <Stack.Screen
          name="AccountSuspended"
          component={AccountSuspendedScreen}
        />
      </Stack.Navigator>
    );
  }

  const recoveryLocked = Boolean(recovery || loadRecoveryState());

  // Cold process opens Splash1 once. Warm remounts resume without splash.
  const initialRouteName = processStarted ? 'SignIn' : 'Splash1';

  if (initialRouteName === 'Splash1') {
    return (
      <SplashStack.Navigator
        key="app"
        initialRouteName="Splash1"
        screenOptions={screenOptions}
      >
        <SplashStack.Screen name="Splash1" component={SplashScreen1} />
        <SplashStack.Screen name="Splash2" component={SplashScreen2} />
      </SplashStack.Navigator>
    );
  }

  const showAuthenticatedProduct =
    !recoveryLocked &&
    isSignedIn &&
    Boolean(apiUser?.emailVerified) &&
    isAuthenticatedProductActive() &&
    Boolean(apiUser?.id);

  if (showAuthenticatedProduct && apiUser?.id) {
    return (
      <AuthenticatedProviders key={apiUser.id} userId={apiUser.id}>
        <AuthenticatedNavigator userId={apiUser.id} />
      </AuthenticatedProviders>
    );
  }

  return (
    <SignedOutBranch
      recoveryLocked={recoveryLocked}
      hasSession={Boolean(session || apiUser)}
    />
  );
}
