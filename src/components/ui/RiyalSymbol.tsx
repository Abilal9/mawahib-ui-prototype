import React from 'react';
import { ImageStyle, StyleProp } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../theme';

const RIYAL_LOGO = require('../../../assets/images/saudi-riyal-symbol.png');

type Props = {
  size?: number;
  color?: string;
  style?: StyleProp<ImageStyle>;
};

/** Official Saudi Riyal symbol (SAMA logo) for price displays. */
export default function RiyalSymbol({
  size = 16,
  color = colors.text,
  style,
}: Props) {
  const width = size * 0.9;
  return (
    <Image
      source={RIYAL_LOGO}
      style={[{ width, height: size }, style]}
      tintColor={color}
      contentFit="contain"
      accessibilityLabel="Saudi Riyal"
    />
  );
}
