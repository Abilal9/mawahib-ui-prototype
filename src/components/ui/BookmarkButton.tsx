import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

type BookmarkKind = 'post' | 'job' | 'service';

const LABEL: Record<BookmarkKind, { save: string; remove: string }> = {
  post: { save: 'Save post', remove: 'Remove post from saved' },
  job: { save: 'Save job', remove: 'Remove job from saved' },
  service: { save: 'Save service', remove: 'Remove service from saved' },
};

export default function BookmarkButton({
  kind,
  saved,
  onPress,
  size = 20,
  idleColor = colors.textTertiary,
}: {
  kind: BookmarkKind;
  saved: boolean;
  onPress: () => void;
  size?: number;
  idleColor?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityState={{ selected: saved }}
      accessibilityLabel={saved ? LABEL[kind].remove : LABEL[kind].save}
    >
      <Ionicons
        name={saved ? 'bookmark' : 'bookmark-outline'}
        size={size}
        color={saved ? colors.primary : idleColor}
      />
    </TouchableOpacity>
  );
}
