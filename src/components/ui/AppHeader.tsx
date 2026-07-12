import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../theme';
import { toImageSource } from '../../utils/image';
import { currentUser } from '../../data/mock/users';

interface AppHeaderProps {
  onAvatarPress?: () => void;
  onNotificationPress?: () => void;
  notificationCount?: number;
}

export default function AppHeader({
  onAvatarPress,
  onNotificationPress,
  notificationCount = 0,
}: AppHeaderProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.8}>
        <Image source={toImageSource(currentUser.avatar)} style={styles.avatar} />
      </TouchableOpacity>

      <Image
        source={require('../../../assets/images/logo.png')}
        style={styles.logo}
        contentFit="contain"
      />

      <TouchableOpacity
        onPress={onNotificationPress}
        activeOpacity={0.8}
        style={styles.bellButton}
      >
        <Ionicons name="notifications-outline" size={24} color={colors.text} />
        {notificationCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {notificationCount > 9 ? '9+' : notificationCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.screen,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.avatar,
  },
  logo: {
    width: 100,
    height: 32,
  },
  bellButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    ...typography.caption,
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
});
