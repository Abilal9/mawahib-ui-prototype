import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../../theme';
import { toImageSource } from '../../utils/image';
import { useMyProfile } from '../../context/ProfileContext';

interface AppHeaderProps {
  onAvatarPress?: () => void;
  onNotificationPress?: () => void;
  notificationCount?: number;
}

/** Layout footprint stays compact; drawn size is 2× so neighbors don’t shift */
const LOGO_LAYOUT = 56;
const LOGO_DRAW = 112;
const SIDE_ICON_SIZE = 32;

export default function AppHeader({
  onAvatarPress,
  onNotificationPress,
  notificationCount = 0,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const { user } = useMyProfile();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <View style={styles.leftSlot}>
          <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.8}>
            <Image source={toImageSource(user.avatar)} style={styles.avatar} />
          </TouchableOpacity>
        </View>

        <View style={styles.centerSlot}>
          <Image
            source={require('../../../assets/images/arabic-emblem.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        <View style={styles.rightSlot}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
  },
  leftSlot: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  centerSlot: {
    width: LOGO_LAYOUT,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSlot: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  avatar: {
    width: SIDE_ICON_SIZE,
    height: SIDE_ICON_SIZE,
    borderRadius: SIDE_ICON_SIZE / 2,
  },
  logo: {
    position: 'absolute',
    width: LOGO_DRAW,
    height: LOGO_DRAW,
  },
  bellButton: {
    width: SIDE_ICON_SIZE,
    height: SIDE_ICON_SIZE,
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
