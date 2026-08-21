import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
  type ImageStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import {
  defaultAvatarIconSize,
  hasCustomAvatar,
  MAWAHIB_DEFAULT_AVATAR_BG,
} from '../../lib/avatar';
import { toImageSource } from '../../utils/image';
import { colors } from '../../theme';

type Props = {
  /** Custom avatar URI, require() asset id, or empty/null for Mawahib default. */
  uri?: string | number | null;
  /** Diameter in px. Prefer this for list/card/profile sizes. */
  size?: number;
  /**
   * When true, fills the parent (e.g. animated collapsing header wrap).
   * Parent must supply width/height (and usually overflow:hidden + circular radius).
   */
  fill?: boolean;
  style?: StyleProp<ViewStyle | ImageStyle>;
  /** Optional override for silhouette size. */
  iconSize?: number;
  testID?: string;
};

/**
 * Canonical user avatar. Custom image when `uri` is valid; otherwise pink
 * #F6339A circle + white person silhouette. Broken images fall back to default.
 */
export default function UserAvatar({
  uri,
  size = 40,
  fill = false,
  style,
  iconSize: iconSizeProp,
  testID,
}: Props) {
  const [failed, setFailed] = useState(false);
  const [layoutSize, setLayoutSize] = useState(size);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  const showImage = hasCustomAvatar(uri) && !failed;

  const onLayout = (e: LayoutChangeEvent) => {
    if (!fill) return;
    const w = e.nativeEvent.layout.width;
    if (w > 0) setLayoutSize(w);
  };

  const iconSize =
    iconSizeProp ?? defaultAvatarIconSize(fill ? layoutSize : size);

  const containerStyle = useMemo(() => {
    if (fill) {
      return [styles.fill, style];
    }
    return [
      {
        width: size,
        height: size,
        borderRadius: size / 2,
      },
      style,
    ];
  }, [fill, size, style]);

  if (showImage) {
    return (
      <Image
        testID={testID}
        source={toImageSource(uri as string | number)}
        style={containerStyle as StyleProp<ImageStyle>}
        contentFit="cover"
        onError={() => setFailed(true)}
        onLayout={onLayout}
      />
    );
  }

  return (
    <View
      testID={testID}
      accessibilityRole="image"
      accessibilityLabel="Default profile avatar"
      onLayout={onLayout}
      style={[
        containerStyle,
        styles.defaultWrap,
        { backgroundColor: MAWAHIB_DEFAULT_AVATAR_BG },
      ]}
    >
      <Ionicons name="person" size={iconSize} color={colors.white} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    width: '100%',
    height: '100%',
  },
  defaultWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
