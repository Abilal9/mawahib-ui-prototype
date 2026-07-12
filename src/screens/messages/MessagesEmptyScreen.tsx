import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Button from '../../components/ui/Button';
import { colors, spacing, typography } from '../../theme';
import { TabScreenProps } from '../../navigation/types';

export default function MessagesEmptyScreen({ navigation }: TabScreenProps<'MessagesTab'>) {
  return (
    <ScreenContainer>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.illustration}>
          <Ionicons name="chatbubbles-outline" size={72} color={colors.primary} />
        </View>
        <Text style={styles.title}>No Messages Yet</Text>
        <Text style={styles.subtitle}>
          Start a conversation with talented creatives or respond to inquiries about your work.
        </Text>
        <Button
          title="Explore Talents"
          onPress={() => navigation.navigate('SearchTab')}
          fullWidth
          style={styles.cta}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  illustration: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: colors.primary + '12',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.md, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  cta: { marginTop: spacing.xxxl, maxWidth: 280 },
});
