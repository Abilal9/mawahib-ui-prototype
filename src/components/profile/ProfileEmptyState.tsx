import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../theme';

interface ProfileEmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  cta: string;
  onPress: () => void;
  showHeaderAdd?: boolean;
  headerTitle?: string;
  onHeaderAdd?: () => void;
}

export default function ProfileEmptyState({
  icon,
  title,
  description,
  cta,
  onPress,
  showHeaderAdd,
  headerTitle,
  onHeaderAdd,
}: ProfileEmptyStateProps) {
  return (
    <View style={styles.wrap}>
      {showHeaderAdd && headerTitle ? (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <TouchableOpacity onPress={onHeaderAdd ?? onPress} hitSlop={8}>
            <Ionicons name="add" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      ) : null}
      <View style={styles.body}>
        <Ionicons name={icon} size={48} color={colors.textSecondary} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <TouchableOpacity style={styles.cta} onPress={onPress} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color={colors.white} />
          <Text style={styles.ctaText}>{cta}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  body: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    minWidth: 200,
    justifyContent: 'center',
  },
  ctaText: {
    ...typography.button,
    color: colors.white,
  },
});
