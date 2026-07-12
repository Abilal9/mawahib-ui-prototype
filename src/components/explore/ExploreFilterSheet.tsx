import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../theme';
import {
  ExploreFilters,
  ExploreJobType,
  ExploreLocation,
  ExploreSort,
} from '../../data/mock/explore';

interface ExploreFilterSheetProps {
  visible: boolean;
  filters: ExploreFilters;
  showJobType?: boolean;
  onClose: () => void;
  onApply: (filters: ExploreFilters) => void;
  onReset: () => void;
}

const SORT_OPTIONS: { id: ExploreSort; label: string }[] = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'top-rated', label: 'Top rated' },
  { id: 'newest', label: 'Newest' },
  { id: 'price-low', label: 'Price: Low to High' },
  { id: 'price-high', label: 'Price: High to Low' },
];

const LOCATION_OPTIONS: { id: ExploreLocation; label: string }[] = [
  { id: 'all', label: 'All locations' },
  { id: 'dubai', label: 'Dubai, UAE' },
  { id: 'riyadh', label: 'Riyadh, KSA' },
  { id: 'remote', label: 'Remote' },
];

const JOB_TYPE_OPTIONS: { id: ExploreJobType; label: string }[] = [
  { id: 'all', label: 'All types' },
  { id: 'full-time', label: 'Full-time' },
  { id: 'part-time', label: 'Part-time' },
  { id: 'contract', label: 'Contract' },
  { id: 'freelance', label: 'Freelance' },
];

function ChipRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.chipWrap}>
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => onChange(option.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function ExploreFilterSheet({
  visible,
  filters,
  showJobType = false,
  onClose,
  onApply,
  onReset,
}: ExploreFilterSheetProps) {
  const [draft, setDraft] = React.useState(filters);

  React.useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity onPress={onReset}>
            <Text style={styles.reset}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <ChipRow
            label="Sort by"
            options={SORT_OPTIONS}
            value={draft.sort}
            onChange={(sort) => setDraft((prev) => ({ ...prev, sort }))}
          />
          <ChipRow
            label="Location"
            options={LOCATION_OPTIONS}
            value={draft.location}
            onChange={(location) => setDraft((prev) => ({ ...prev, location }))}
          />
          {showJobType && (
            <ChipRow
              label="Job type"
              options={JOB_TYPE_OPTIONS}
              value={draft.jobType}
              onChange={(jobType) => setDraft((prev) => ({ ...prev, jobType }))}
            />
          )}
        </ScrollView>

        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => {
            onApply(draft);
            onClose();
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.applyText}>Apply filters</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xxl,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  reset: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFF0F7',
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  applyText: {
    ...typography.button,
    color: colors.white,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.screen,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
