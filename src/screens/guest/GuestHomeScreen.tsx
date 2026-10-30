import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenContainer from '../../components/ui/ScreenContainer';
import GuestAppHeader from '../../components/layout/GuestAppHeader';
import { listPaddingAboveTabBar } from '../../components/layout/CustomTabBar';
import { colors, spacing, typography } from '../../theme';
import type { GuestTabScreenProps } from '../../navigation/types';

/** Structural Guest Home shell. Public discovery APIs are Phase F. */
export default function GuestHomeScreen(_props: GuestTabScreenProps<'HomeTab'>) {
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
        <Text style={styles.title}>Home</Text>
        <Text style={styles.copy}>
          Browse talents, services, jobs, and posts after this shell is connected
          to public discovery.
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
