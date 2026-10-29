import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SavedProvider } from './src/context/SavedContext';
import { SidebarProvider } from './src/context/SidebarContext';
import { CreateMenuProvider } from './src/context/CreateMenuContext';
import { ProfileProvider } from './src/context/ProfileContext';
import { UserJobsProvider } from './src/context/UserJobsContext';
import { ConnectionsProvider } from './src/context/ConnectionsContext';
import { PostsProvider } from './src/context/PostsContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import { MessagingUnreadProvider } from './src/context/MessagingUnreadContext';
import AuthDeepLinkListener from './src/components/auth/AuthDeepLinkListener';
import AuthTransitionOverlay from './src/components/auth/AuthTransitionOverlay';
import { hasConsumedProcessStart } from './src/lib/processStart';
import { colors } from './src/theme';

SplashScreen.preventAutoHideAsync();

/**
 * Media fetch gate (Phase B):
 * - AuthContext.mediaCacheReady is false until durable owner is established.
 * - After process start, RootNavigator unmounts product Image trees while
 *   !ready. Splash2 will not leave splash until ready.
 * - Overlay sits beside NavigationContainer and never unmounts it.
 * - Providers may fetch JSON; they do not prefetch expo-image bitmaps.
 */

function AppProviders() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const fontsReady = fontsLoaded || fontError != null;
  const { mediaCacheReady, mediaCacheBlocked, retryMediaCache } = useAuth();
  const showOverlay =
    mediaCacheBlocked || (hasConsumedProcessStart() && !mediaCacheReady);

  useEffect(() => {
    if (fontsReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsReady]);

  if (!fontsReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SidebarProvider>
      <CreateMenuProvider>
        <ProfileProvider>
          <PostsProvider>
            <NotificationsProvider>
              <MessagingUnreadProvider>
                <UserJobsProvider>
                  <ConnectionsProvider>
                    <View style={{ flex: 1 }}>
                      <NavigationContainer>
                        <StatusBar style="dark" />
                        <AuthDeepLinkListener />
                        <RootNavigator />
                      </NavigationContainer>
                      <AuthTransitionOverlay
                        visible={showOverlay}
                        failed={mediaCacheBlocked}
                        onRetry={retryMediaCache}
                      />
                    </View>
                  </ConnectionsProvider>
                </UserJobsProvider>
              </MessagingUnreadProvider>
            </NotificationsProvider>
          </PostsProvider>
        </ProfileProvider>
      </CreateMenuProvider>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <SavedProvider>
            <AppProviders />
          </SavedProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
