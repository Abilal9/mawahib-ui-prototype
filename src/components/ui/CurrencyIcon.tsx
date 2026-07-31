import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../theme';
import { useMyProfile } from '../../context/ProfileContext';
import { resolveCurrencyFromLocation } from '../../utils/currency';

const RIYAL_LOGO = require('../../../assets/images/saudi-riyal-symbol.png');
const DIRHAM_LOGO = require('../../../assets/images/uae-dirham-symbol.png');

type Props = {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  /** Override location; defaults to the signed-in user's profile location. */
  location?: string | null;
};

/** Location-aware currency logo: Dirham for UAE locations, Riyal otherwise. */
export default function CurrencyIcon({
  size = 16,
  color = colors.text,
  style,
  location,
}: Props) {
  const { user } = useMyProfile();
  const currency = resolveCurrencyFromLocation(
    location !== undefined ? location : user.location
  );
  const isDirham = currency === 'AED';
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
