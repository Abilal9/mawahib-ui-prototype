import React from 'react';
import { StyleProp, ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../theme';
import { useMyProfile } from '../../context/ProfileContext';
import { resolveCurrencyFromLocation } from '../../utils/currency';

/**
 * Preferred price glyph for the app: picks Dirham vs Riyal from location.
 * Prefer this over RiyalSymbol when the owner's/viewer's locale matters.
 */

const RIYAL_LOGO = require('../../../assets/images/saudi-riyal-symbol.png');
const DIRHAM_LOGO = require('../../../assets/images/uae-dirham-symbol.png');

type Props = {
  size?: number;
  color?: string;
  style?: StyleProp<ImageStyle>;
  /** Override location; defaults to the signed-in user's profile location. */
  location?: string | null;
};

/** Location-aware currency logo: Dirham for UAE locations, Riyal otherwise. */
export default function CurrencyIcon({
  size = 16,
  color = colors.primary,
  style,
  location,
}: Props) {
  const { user } = useMyProfile();
  // Explicit `location` (including null) wins so visitor cards can use the provider's locale.
  const currency = resolveCurrencyFromLocation(
    location !== undefined ? location : user.location
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
