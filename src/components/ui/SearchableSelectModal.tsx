import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../../theme';

export type SelectOption = {
  value: string;
  label: string;
  meta?: string;
};

type Props = {
  visible: boolean;
  title: string;
  options: SelectOption[];
  selectedValue?: string | null;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSelect: (option: SelectOption) => void;
  onClose: () => void;
};

export default function SearchableSelectModal({
  visible,
  title,
  options,
  selectedValue,
  searchable = true,
  searchPlaceholder = 'Search…',
  onSelect,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q) ||
        (o.meta?.toLowerCase().includes(q) ?? false),
    );
  }, [options, query]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={8} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        {searchable ? (
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={16} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.textSecondary}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query ? (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.value}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const selected = item.value === selectedValue;
            return (
              <TouchableOpacity
                style={[styles.row, selected && styles.rowSelected]}
                onPress={() => {
                  onSelect(item);
                  setQuery('');
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <View style={styles.rowContent}>
                  {item.meta ? <Text style={styles.rowMeta}>{item.meta}</Text> : null}
                  <Text style={styles.rowLabel} numberOfLines={1}>
                    {item.label}
                  </Text>
                </View>
                {selected ? (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                ) : null}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>No matches</Text>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    maxHeight: '70%',
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    marginBottom: spacing.sm,
  },
  title: { ...typography.h3, color: colors.text },
  closeBtn: { padding: 4 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.screen,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    height: 42,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  rowSelected: {
    backgroundColor: '#FDF2F8',
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  rowLabel: { ...typography.bodyMedium, color: colors.text, flexShrink: 1 },
  rowMeta: { fontSize: 20, lineHeight: 24 },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.xl,
  },
});
