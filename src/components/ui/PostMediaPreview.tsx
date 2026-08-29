import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors, spacing, typography } from '../../theme';
import { getPostMediaPreviewLayout } from '../../utils/postMediaPreview';

type Props = {
  /** Position-ordered image URLs (media[0] first). */
  images: string[];
  onPress?: () => void;
};

/**
 * Home feed media preview:
 * large primary + thumbnail strip; final thumb shows +N when total > 4.
 */
export default function PostMediaPreview({ images, onPress }: Props) {
  const { primary, thumbnails, remainingCount } = getPostMediaPreviewLayout(images);
  if (!primary) return null;

  return (
    <View style={styles.wrap}>
      <TouchableOpacity activeOpacity={0.95} onPress={onPress} accessibilityRole="imagebutton">
        <Image
          source={{ uri: primary }}
          style={styles.primary}
          contentFit="cover"
          recyclingKey={primary}
        />
      </TouchableOpacity>

      {thumbnails.length > 0 ? (
        <View style={styles.thumbRow}>
          {thumbnails.map((uri, index) => {
            const isLast = index === thumbnails.length - 1;
            const showOverlay = isLast && remainingCount > 0;
            return (
              <TouchableOpacity
                key={`${uri}-${index}`}
                style={styles.thumbCell}
                activeOpacity={0.95}
                onPress={onPress}
                accessibilityRole="imagebutton"
                accessibilityLabel={
                  showOverlay
                    ? `${remainingCount} more images`
                    : `Image ${index + 2}`
                }
              >
                <Image
                  source={{ uri }}
                  style={styles.thumbImage}
                  contentFit="cover"
                  recyclingKey={uri}
                />
                {showOverlay ? (
                  <View style={styles.overlay} pointerEvents="none">
                    <Text style={styles.overlayText}>+{remainingCount}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const THUMB_HEIGHT = 78;

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.md,
  },
  primary: {
    width: '100%',
    height: 220,
    backgroundColor: colors.borderLight,
  },
  thumbRow: {
    flexDirection: 'row',
    marginTop: 2,
    gap: 2,
  },
  thumbCell: {
    flex: 1,
    height: THUMB_HEIGHT,
    backgroundColor: colors.borderLight,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    ...typography.h3,
    color: colors.white,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
