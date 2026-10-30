import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenContainer from '../../components/ui/ScreenContainer';
import GuestAppHeader from '../../components/layout/GuestAppHeader';
import { listPaddingAboveTabBar } from '../../components/layout/CustomTabBar';
import { colors, spacing, typography } from '../../theme';
import type { GuestTabScreenProps } from '../../navigation/types';

/** Structural Guest Explore shell. No authenticated Explore hooks. */
export default function GuestExploreScreen(
  _props: GuestTabScreenProps<'SearchTab'>,
) {
  const insets = useSafeAreaInsets();

  return (
    <ScreenContainer padded={false} safeTop={false} backgroundColor={colors.background}>
      <StatusBar style="dark" />
      <GuestAppHeader />
      <View
        style={[
          styles.body,
          { paddingBottom: listPaddingAboveTabBar(insets.bottom, spacing.xl) },
        ]}
      >
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.copy}>
          Public search for talents, services, and jobs will live here. Saved,
          connections, and viewer filters stay in the signed-in app.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  copy: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
});
