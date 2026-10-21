import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import type { ExploreTab } from '../../data/mock/explore';
import {
  categoriesForExploreTab,
  emptyExploreTaxonomy,
  toggleExploreCategory,
  type ExploreTaxonomySelection,
} from '../../domain/exploreTaxonomy';
import { loadTaxonomy, type TaxonomyCategory } from '../../services/taxonomyApi';

export type ExploreSelectionUpdate =
  | ExploreTaxonomySelection
  | ((current: ExploreTaxonomySelection) => ExploreTaxonomySelection);

export default function ExploreTaxonomyFilters({
  tab,
  value,
  catalogAttempt = 0,
  onChange,
}: {
  tab: ExploreTab;
  value: ExploreTaxonomySelection;
  catalogAttempt?: number;
  onChange: (update: ExploreSelectionUpdate) => void;
}) {
  const [categories, setCategories] = useState<TaxonomyCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadTaxonomy()
      .then((catalog) => {
        if (!active) return;
        setCategories(catalog.categories);
        setFailed(false);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setFailed(true);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt, catalogAttempt]);

  const visible = categoriesForExploreTab(categories, tab);
  const count = value.categoryIds.length;

  return (
    <View style={styles.wrap}>
      {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
      {failed ? (
        <TouchableOpacity onPress={() => setAttempt((current) => current + 1)}>
          <Text style={styles.retry}>Couldn’t load categories. Tap to retry.</Text>
        </TouchableOpacity>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {visible.map((category) => {
            const selected = value.categoryIds.includes(category.id);
            return (
              <TouchableOpacity
                key={category.id}
                style={[styles.chip, selected && styles.chipOn]}
                onPress={() =>
                  onChange((current) => ({
                    categoryIds: toggleExploreCategory(current.categoryIds, category.id),
                  }))
                }
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={category.nameEn}
              >
                <Text style={[styles.chipText, selected && styles.chipTextOn]}>
                  {category.nameEn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
      {count > 0 ? (
        <View style={styles.actions}>
          <Text style={styles.count}>Filters {count}</Text>
          <TouchableOpacity
            onPress={() => onChange(emptyExploreTaxonomy())}
            accessibilityRole="button"
            accessibilityLabel="Clear filters"
          >
            <Text style={styles.clear}>Clear</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: spacing.xs, gap: spacing.xs },
  loader: { alignSelf: 'flex-start', marginLeft: spacing.screen },
  retry: {
    ...typography.caption,
    color: colors.primary,
    paddingHorizontal: spacing.screen,
  },
  chips: { paddingHorizontal: spacing.screen, gap: spacing.xs },
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingHorizontal: 12,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.text, fontWeight: '600' },
  chipTextOn: { color: colors.white },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.screen,
  },
  count: { ...typography.caption, color: colors.textSecondary },
  clear: { ...typography.caption, color: colors.primary, fontWeight: '600' },
});
