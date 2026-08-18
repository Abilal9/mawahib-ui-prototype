import React from 'react';
import { StyleProp, ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../theme';
import { useMyProfile } from '../../context/ProfileContext';
import { resolveCurrencyCode } from '../../utils/currency';
import type { CurrencyCode } from '../../data/location/geo';

/**
 * Preferred price glyph for the app: picks Dirham vs Riyal from currency/location.
 * Prefer this over RiyalSymbol when the owner's/viewer's locale matters.
 */

const RIYAL_LOGO = require('../../../assets/images/saudi-riyal-symbol.png');
const DIRHAM_LOGO = require('../../../assets/images/uae-dirham-symbol.png');

type Props = {
  size?: number;
  color?: string;
  style?: StyleProp<ImageStyle>;
  /** Explicit currency wins over location heuristic. */
  currency?: CurrencyCode | null;
  /** Override location; defaults to the signed-in user's profile location. */
  location?: string | null;
};

/** Currency-aware logo: Dirham for AED, Riyal otherwise. */
export default function CurrencyIcon({
  size = 16,
  color = colors.primary,
  style,
  currency: currencyProp,
  location,
}: Props) {
  const { user } = useMyProfile();
  // Explicit `currency` wins. Explicit `location` (incl. null) skips the viewer's defaultCurrency.
  const currency = resolveCurrencyCode(
    currencyProp != null
      ? currencyProp
      : location !== undefined
        ? null
        : user.defaultCurrency,
    location !== undefined ? location : user.location,
  );
  const isDirham = currency === 'AED';
  // Dirham mark is slightly wider; keep Riyal a touch narrower for optical balance.
  const width = size * (isDirham ? 1 : 0.9);

  return (
    <Image
      source={isDirham ? DIRHAM_LOGO : RIYAL_LOGO}
      style={[{ width, height: size }, style]}
      tintColor={color}
      contentFit="contain"
      accessibilityLabel={isDirham ? 'UAE Dirham' : 'Saudi Riyal'}
    />
  );
}
