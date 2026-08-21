import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UserAvatar from '../ui/UserAvatar';
import { colors, spacing, typography } from '../../theme';
import { User } from '../../data/types';
interface ProfileHeroProps {
  user: User;
  title: string;
  isOwn: boolean;
  onBack: () => void;
  onShare?: () => void;
  onMessage?: () => void;
  connectionsLabel?: string;
  onConnectionsPress?: () => void;
  onReviewsPress?: () => void;
}

export default function ProfileHero({
  user,
  title,
  isOwn,
  onBack,
  onShare,
  onMessage,
  connectionsLabel,
  onConnectionsPress,
  onReviewsPress,
}: ProfileHeroProps) {
  const insets = useSafeAreaInsets();
  const rating = user.rating ?? 5;
  const reviews = user.reviewCount ?? 0;
  const connections = connectionsLabel ?? `${user.followers ?? 0} connections`;

  return (
    <View style={styles.header}>
      <LinearGradient
        colors={['#E60076', '#F6339A', '#FFB3D9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.wave}
      />
      <View style={[styles.headerBar, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.headerButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={isOwn ? onShare : onMessage}
        >
          <Ionicons
            name={isOwn ? 'share-outline' : 'chatbubble-outline'}
            size={22}
            color={colors.white}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.center}>
        <UserAvatar uri={user.avatar} size={88} style={styles.avatar} />
        <View style={styles.nameRow}>
          <Text style={styles.name}>{user.name}</Text>
          {user.isVerified ? (
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          ) : null}
        </View>
        <Text style={styles.role}>{user.title ?? 'Creative Professional'}</Text>
        {user.location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
        ) : null}

        <View style={styles.metaBlock}>
          <TouchableOpacity style={styles.ratingRow} onPress={onReviewsPress} activeOpacity={0.8}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Ionicons
                key={i}
                name={i < Math.round(rating) ? 'star' : 'star-outline'}
                size={14}
                color="#F5A623"
              />
            ))}
            <Text style={styles.ratingText}>
              {rating.toFixed(rating % 1 === 0 ? 0 : 1)}{' '}
            </Text>
            <Text style={styles.reviewsLink}>{reviews} reviews</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onConnectionsPress} activeOpacity={0.8}>
            <Text style={styles.connectionsLink}>{connections}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.white,
    paddingBottom: spacing.lg,
  },
  wave: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 168,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    marginBottom: spacing.md,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.white,
  },
  center: {
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: colors.white,
    marginBottom: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    ...typography.h2,
    color: colors.text,
  },
  role: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  location: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  metaBlock: {
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    ...typography.caption,
    color: colors.text,
    marginLeft: 4,
    fontWeight: '600',
  },
  reviewsLink: {
    ...typography.caption,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  connectionsLink: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
  },
});
