import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../theme';
import {
  COUNTRY_CATALOG,
  type CountryCode,
  isValidLocationPair,
  locationsForCountry,
  SUPPORTED_COUNTRY_CODES,
} from '../../data/location/geo';

type Props = {
  countryCode: CountryCode | null;
  locationCode: string | null;
  onCountryChange: (code: CountryCode) => void;
  onLocationChange: (code: string) => void;
  disabled?: boolean;
  countryLabel?: string;
  locationLabel?: string;
};

export default function LocationSelectors({
  countryCode,
  locationCode,
  onCountryChange,
  onLocationChange,
  disabled,
  countryLabel = 'Country',
  locationLabel = 'City / Emirate',
}: Props) {
  const [countryOpen, setCountryOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  const country = countryCode ? COUNTRY_CATALOG[countryCode] : null;
  const locations = useMemo(
    () => (countryCode ? locationsForCountry(countryCode) : []),
    [countryCode],
  );
  const selectedLocation = useMemo(
    () => locations.find((l) => l.code === locationCode) ?? null,
    [locations, locationCode],
  );

  const handleCountryChange = (code: CountryCode) => {
    onCountryChange(code);
    if (locationCode && !isValidLocationPair(code, locationCode)) {
      onLocationChange('');
    }
    setCountryOpen(false);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{countryLabel}</Text>
      <TouchableOpacity
        style={[styles.selector, disabled && styles.selectorDisabled]}
        onPress={() => !disabled && setCountryOpen(true)}
        activeOpacity={0.8}
        disabled={disabled}
      >
        <Text
          style={[
            styles.selectorValue,
            !country && styles.placeholder,
          ]}
        >
          {country?.label ?? 'Select country'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      <Text style={[styles.label, styles.locationLabel]}>{locationLabel}</Text>
      <TouchableOpacity
        style={[
          styles.selector,
          (disabled || !countryCode) && styles.selectorDisabled,
        ]}
        onPress={() => !disabled && countryCode && setLocationOpen(true)}
        activeOpacity={0.8}
        disabled={disabled || !countryCode}
      >
        <Text
          style={[
            styles.selectorValue,
            !selectedLocation && styles.placeholder,
          ]}
        >
          {selectedLocation?.label ??
            (countryCode ? 'Select city / emirate' : 'Select a country first')}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={countryOpen} animationType="slide" transparent>
        <Pressable style={styles.backdrop} onPress={() => setCountryOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>Select country</Text>
            <FlatList
              data={SUPPORTED_COUNTRY_CODES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const entry = COUNTRY_CATALOG[item];
                return (
                  <TouchableOpacity
                    style={styles.optionRow}
                    onPress={() => handleCountryChange(item)}
                  >
                    <Text style={styles.optionName}>{entry.label}</Text>
                    {countryCode === item ? (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={colors.primary}
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={locationOpen} animationType="slide" transparent>
        <Pressable
          style={styles.backdrop}
          onPress={() => setLocationOpen(false)}
        >
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>Select city / emirate</Text>
            <FlatList
              data={locations}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => {
                    onLocationChange(item.code);
                    setLocationOpen(false);
                  }}
                >
                  <Text style={styles.optionName}>{item.label}</Text>
                  {locationCode === item.code ? (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={colors.primary}
                    />
                  ) : null}
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  locationLabel: {
    marginTop: spacing.md,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    height: 48,
    backgroundColor: colors.white,
  },
  selectorDisabled: {
    opacity: 0.55,
  },
  selectorValue: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  placeholder: {
    color: colors.textSecondary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '70%',
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: spacing.lg,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionName: { ...typography.body, color: colors.text, flex: 1 },
});
