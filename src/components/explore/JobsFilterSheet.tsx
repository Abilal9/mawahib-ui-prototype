import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { colors, spacing, radius, typography } from '../../theme';
import { UserJobStatus } from '../../data/types/userJobs';

export type JobsSort = 'newest' | 'oldest' | 'due-date';

export interface JobsFilters {
  status: 'all' | UserJobStatus;
  sort: JobsSort;
}

export const defaultJobsFilters: JobsFilters = {
  status: 'all',
  sort: 'newest',
};

interface JobsFilterSheetProps {
  visible: boolean;
  filters: JobsFilters;
  onClose: () => void;
  onApply: (filters: JobsFilters) => void;
  onReset: () => void;
}

/** Includes real statuses used in seed/UI (`done` alias of completed, sent-for-review, etc.) */
const STATUS_OPTIONS: { id: JobsFilters['status']; label: string }[] = [
  { id: 'all', label: 'All statuses' },
  { id: 'pending', label: 'Pending' },
  { id: 'sent-for-review', label: 'Sent for review' },
  { id: 'pending-payment', label: 'Pending payment' },
  { id: 'in-progress', label: 'In progress' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'done', label: 'Done' },
  { id: 'declined', label: 'Declined' },
];

const SORT_OPTIONS: { id: JobsSort; label: string }[] = [
  { id: 'newest', label: 'Newest first' },
  { id: 'oldest', label: 'Oldest first' },
  { id: 'due-date', label: 'Due date' },
];

export default function JobsFilterSheet({
  visible,
  filters,
  onClose,
  onApply,
  onReset,
}: JobsFilterSheetProps) {
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
          <Text style={styles.title}>Filter jobs</Text>
          <TouchableOpacity onPress={onReset}>
            <Text style={styles.reset}>Reset</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Status</Text>
        <View style={styles.chipWrap}>
          {STATUS_OPTIONS.map((option) => {
            const selected = draft.status === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setDraft((prev) => ({ ...prev, status: option.id }))}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Sort by</Text>
        <View style={styles.chipWrap}>
          {SORT_OPTIONS.map((option) => {
            const selected = draft.sort === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setDraft((prev) => ({ ...prev, sort: option.id }))}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => {
            onApply(draft);
            onClose();
          }}
        >
          <Text style={styles.applyText}>Apply filters</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xxl,
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
  title: { ...typography.h3, color: colors.text },
  reset: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  sectionLabel: { ...typography.label, color: colors.text, marginBottom: spacing.sm },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: '#FFF0F7' },
  chipText: { ...typography.bodySmall, color: colors.textSecondary },
  chipTextSelected: { color: colors.primary, fontWeight: '600' },
  applyButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  applyText: { ...typography.button, color: colors.white },
});
