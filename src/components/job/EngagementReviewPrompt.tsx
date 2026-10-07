import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';

interface Props {
  /** Other party's display name. */
  otherName: string;
  /** The viewer's existing rating; when set the prompt becomes read-only. */
  existingRating?: number;
  onSelectRating: (rating: number) => void;
  /** Smaller stars for list cards. */
  compact?: boolean;
}

/**
 * Review CTA for a completed engagement. Not reviewed → outline stars that open
 * WriteReview at the tapped rating. Reviewed → filled "Your review" stars and
 * no further CTA.
 */
export default function EngagementReviewPrompt({
  otherName,
  existingRating,
  onSelectRating,
  compact,
}: Props) {
  const [preview, setPreview] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const reviewed = (existingRating ?? 0) > 0;
  const size = compact ? 22 : 28;

  if (reviewed) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.label}>Your review</Text>
        <View style={styles.row}>
          {[1, 2, 3, 4, 5].map((v) => (
            <Ionicons
              key={v}
              name={v <= (existingRating ?? 0) ? 'star' : 'star-outline'}
              size={size}
              color={colors.warning}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>How was it working with {otherName}?</Text>
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map((v) => (
          <TouchableOpacity
            key={v}
            hitSlop={8}
            activeOpacity={0.75}
            accessibilityLabel={`Rate ${v} star${v === 1 ? '' : 's'}`}
            onPress={(e) => {
              e.stopPropagation?.();
              setPreview(v);
              if (timer.current) clearTimeout(timer.current);
              timer.current = setTimeout(() => onSelectRating(v), 180);
            }}
          >
            <Ionicons
              name={preview != null && v <= preview ? 'star' : 'star-outline'}
              size={size}
              color={colors.warning}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { ...typography.bodySmall, color: colors.text, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
