import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { BRAND_NAME, SPLASH_TAGLINE } from '../../constants/brand';
import { colors, spacing, typography } from '../../theme';

// Figma Splash Screen 1/2 (8368:11336, 8368:11327) — logo mark ~55.5pt wide, 12pt gap to title
const SPLASH_LOGO_SOLO_SIZE = 80;
const SPLASH_LOGO_ROW_SIZE = 64;
const BRAND_ROW_GAP = spacing.md; // 12px — Figma gap between logo and "Mawahib"
const TAGLINE_TOP_GAP = spacing.md; // 12px — Figma gap from brand row to tagline

interface SplashBrandingProps {
  variant: 'icon' | 'full';
  style?: ViewStyle;
}

export default function SplashBranding({ variant, style }: SplashBrandingProps) {
  const logoIcon = (
    <Image
      source={require('../../../assets/images/arabic-emblem.png')}
      style={variant === 'icon' ? styles.logoIconSolo : styles.logoIconRow}
      contentFit="contain"
    />
  );

  if (variant === 'icon') {
    return <View style={[styles.iconOnly, style]}>{logoIcon}</View>;
  }

  return (
    <View style={[styles.full, style]}>
      <View style={styles.brandRow}>
        {logoIcon}
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
  logoIconSolo: {
    width: SPLASH_LOGO_SOLO_SIZE,
    height: SPLASH_LOGO_SOLO_SIZE,
  },
  logoIconRow: {
    width: SPLASH_LOGO_ROW_SIZE,
    height: SPLASH_LOGO_ROW_SIZE,
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
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 236,
    marginTop: TAGLINE_TOP_GAP,
  },
});
