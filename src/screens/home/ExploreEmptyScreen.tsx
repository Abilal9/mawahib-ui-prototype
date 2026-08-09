import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Button from '../../components/ui/Button';
import { colors, spacing, typography } from '../../theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

/** Unregistered orphan — kept for later empty-explore UX. */
export default function ExploreEmptyScreen({
  navigation,
}: {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}) {
  return (
    <ScreenContainer>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.illustration}>
          <Ionicons name="compass-outline" size={80} color={colors.primary} />
        </View>
        <Text style={styles.title}>Nothing Here Yet</Text>
        <Text style={styles.subtitle}>
          Your explore feed is empty. Discover talented creatives and inspiring work from the Mawahib community.
        </Text>
        <Button
          title="Explore Talents"
          onPress={() => navigation.navigate('MainTabs', { screen: 'SearchTab' })}
          fullWidth
          style={styles.cta}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  illustration: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.md, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  cta: { marginTop: spacing.xxxl, maxWidth: 280 },
});
