import React from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import {
  PROFILE_COLLAPSE_DISTANCE,
  PROFILE_WAVE_MAX,
} from './ProfileCollapsingHeader';

export const PROFILE_FIXED_BAR_BODY = 28;

interface ProfileHeaderChromeProps {
  topInset: number;
  scrollY: Animated.Value;
  onBack: () => void;
  rightIcon: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  /** Optional icon shown to the left of the primary right action (e.g. edit next to share) */
  secondaryRightIcon?: keyof typeof Ionicons.glyphMap;
  onSecondaryRightPress?: () => void;
}

/** One continuous pink header: fixed top chrome + collapsing wave that blends into the phone top. */
export default function ProfileHeaderChrome({
  topInset,
  scrollY,
  onBack,
  rightIcon,
  onRightPress,
  secondaryRightIcon,
  onSecondaryRightPress,
}: ProfileHeaderChromeProps) {
  const barTop = Math.max(topInset - 6, 0);
  const fixedBarHeight = barTop + PROFILE_FIXED_BAR_BODY;

  const waveHeight = scrollY.interpolate({
    inputRange: [0, PROFILE_COLLAPSE_DISTANCE],
    outputRange: [PROFILE_WAVE_MAX, 0],
    extrapolate: 'clamp',
  });

  return (
    <>
      <View style={[styles.fixedBar, { paddingTop: barTop, height: fixedBarHeight }]}>
        <TouchableOpacity style={styles.navBtn} onPress={onBack} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={20} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.navSpacer} />
        <View style={styles.rightActions}>
          {secondaryRightIcon ? (
            <TouchableOpacity
              style={styles.navBtn}
              onPress={onSecondaryRightPress}
              activeOpacity={0.85}
            >
              <Ionicons name={secondaryRightIcon} size={18} color={colors.white} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.navBtn} onPress={onRightPress} activeOpacity={0.85}>
            <Ionicons name={rightIcon} size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.wave,
          {
            top: fixedBarHeight - 1,
            height: waveHeight,
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fixedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    backgroundColor: colors.primary,
    zIndex: 30,
  },
  navBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navSpacer: {
    flex: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wave: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
    backgroundColor: colors.primary,
  },
});
