import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { resolveMapsDestination } from '../../utils/googleMapsLink';

/**
 * Saved commercial location.
 * Opens an explicit Google Maps URL when one was saved, otherwise a search
 * built from coordinates or place text. Renders nothing when neither exists.
 */
export default function MapsLocationLink({
  label,
  mapsUrl,
  query,
}: {
  /** Human-readable place. The click destination can be a different URL. */
  label?: string | null;
  mapsUrl?: string | null;
  query?: string | null;
}) {
  const url = resolveMapsDestination({ mapsUrl, query });
  const place = label?.trim() || query?.trim() || '';
  if (!url) return null;

  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.8}
      accessibilityRole="link"
      accessibilityLabel={`View ${place || 'location'} on Google Maps`}
      onPress={() => {
        void Linking.openURL(url);
      }}
    >
      <Ionicons name="location-outline" size={18} color={colors.primary} />
      <View style={styles.copy}>
        {place ? (
          <Text style={styles.place} numberOfLines={2}>
            {place}
          </Text>
        ) : null}
        <Text style={styles.action}>View on Google Maps</Text>
      </View>
      <Ionicons name="open-outline" size={16} color={colors.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  copy: { flex: 1 },
  place: {
    ...typography.bodySmall,
    color: colors.text,
  },
  action: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 2,
  },
});
