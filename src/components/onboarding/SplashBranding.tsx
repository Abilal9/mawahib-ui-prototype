import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { BRAND_NAME, SPLASH_TAGLINE } from '../../constants/brand';
import { colors, spacing, typography } from '../../theme';

/** Layout footprint stays original; drawn size is 2× so text/gap don’t shift */
const SPLASH_LOGO_SOLO_LAYOUT = 80;
const SPLASH_LOGO_SOLO_DRAW = 160;
const SPLASH_LOGO_ROW_LAYOUT = 64;
const SPLASH_LOGO_ROW_DRAW = 128;
const BRAND_ROW_GAP = spacing.md;
const TAGLINE_TOP_GAP = spacing.md;

interface SplashBrandingProps {
  variant: 'icon' | 'full';
  style?: ViewStyle;
}

export default function SplashBranding({ variant, style }: SplashBrandingProps) {
  if (variant === 'icon') {
    return (
      <View style={[styles.iconOnly, style]}>
        <View style={styles.logoSlotSolo}>
          <Image
            source={require('../../../assets/images/arabic-emblem.png')}
            style={styles.logoIconSolo}
            contentFit="contain"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.full, style]}>
      <View style={styles.brandRow}>
        <View style={styles.logoSlotRow}>
          <Image
            source={require('../../../assets/images/arabic-emblem.png')}
            style={styles.logoIconRow}
            contentFit="contain"
          />
        </View>
        <Text style={styles.brandName}>{BRAND_NAME}</Text>
      </View>
      {SPLASH_TAGLINE ? (
        <Text style={styles.tagline}>{SPLASH_TAGLINE}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  iconOnly: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  full: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BRAND_ROW_GAP,
  },
  logoSlotSolo: {
    width: SPLASH_LOGO_SOLO_LAYOUT,
    height: SPLASH_LOGO_SOLO_LAYOUT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSlotRow: {
    width: SPLASH_LOGO_ROW_LAYOUT,
    height: SPLASH_LOGO_ROW_LAYOUT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIconSolo: {
    position: 'absolute',
    width: SPLASH_LOGO_SOLO_DRAW,
    height: SPLASH_LOGO_SOLO_DRAW,
  },
  logoIconRow: {
    position: 'absolute',
    width: SPLASH_LOGO_ROW_DRAW,
    height: SPLASH_LOGO_ROW_DRAW,
  },
  brandName: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.3,
    color: colors.text,
  },
  tagline: {
    ...typography.bodySmall,
    fontSize: 15,
    lineHeight: 24,
    color: colors.text,
    textAlign: 'center',
    maxWidth: 236,
    marginTop: TAGLINE_TOP_GAP,
  },
});
