import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { colors, spacing, radius, typography } from '../../theme';
import { ReviewItem } from '../../data/types';
import { reviewService } from '../../services';
import { useMyProfile } from '../../context/ProfileContext';
import { openUserProfile } from '../../utils/openUserProfile';
import { ScreenProps } from '../../navigation/types';

type SortKey = 'newest' | 'highest' | 'lowest';

export default function ReviewsScreen({ navigation, route }: ScreenProps<'Reviews'>) {
  const { user: me } = useMyProfile();
  const bundle = reviewService.getForUser(route.params?.userId);
  const [sort, setSort] = useState<SortKey>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [minStars, setMinStars] = useState<number | null>(null);

  const reviews = useMemo(() => {
    let list = [...bundle.reviews];
    if (minStars != null) {
      list = list.filter((r) => r.rating >= minStars);
    }
    if (sort === 'highest') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'lowest') {
      list.sort((a, b) => a.rating - b.rating);
    }
    return list;
  }, [bundle.reviews, minStars, sort]);

  return (
    <ScreenContainer padded={false} backgroundColor={colors.white}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{bundle.total} reviews</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setFilterOpen(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="filter-outline" size={18} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setSortOpen(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="swap-vertical-outline" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.summaryCard}>
            <View style={styles.distCol}>
              {bundle.distribution.map((row) => (
                <View key={row.stars} style={styles.distRow}>
                  <Text style={styles.distLabel}>{row.stars}</Text>
                  <Ionicons name="star" size={10} color="#F5A623" />
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${Math.max(row.percent * 100, 2)}%` }]} />
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.summaryRight}>
              <Text style={styles.average}>{bundle.average.toFixed(1)}</Text>
              <View style={styles.summaryStars}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Ionicons
                    key={i}
                    name={i < Math.round(bundle.average) ? 'star' : 'star-outline'}
                    size={14}
                    color={i < Math.round(bundle.average) ? '#F5A623' : colors.border}
                  />
                ))}
              </View>
              <Text style={styles.summaryCount}>{bundle.total} Reviews</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <ReviewRow
            review={item}
            onAuthorPress={() => openUserProfile(navigation, item.authorId, me.id)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No reviews match this filter.</Text>
        }
      />

      <ActionSheet
        visible={sortOpen}
        title="Sort by"
        options={[
          { label: 'Newest', value: 'newest' as SortKey },
          { label: 'Highest rating', value: 'highest' as SortKey },
          { label: 'Lowest rating', value: 'lowest' as SortKey },
        ]}
        selected={sort}
        onSelect={(value) => {
          setSort(value);
          setSortOpen(false);
        }}
        onClose={() => setSortOpen(false)}
      />

      <ActionSheet
        visible={filterOpen}
        title="Filter by rating"
        options={[
          { label: 'All ratings', value: null },
          { label: '5 stars & up', value: 5 },
          { label: '4 stars & up', value: 4 },
          { label: '3 stars & up', value: 3 },
        ]}
        selected={minStars}
        onSelect={(value) => {
          setMinStars(value);
          setFilterOpen(false);
        }}
        onClose={() => setFilterOpen(false)}
      />
    </ScreenContainer>
  );
}

function ReviewRow({
  review,
  onAuthorPress,
}: {
  review: ReviewItem;
  onAuthorPress: () => void;
}) {
  return (
    <View style={styles.reviewRow}>
      <TouchableOpacity onPress={onAuthorPress} activeOpacity={0.8} hitSlop={4}>
        <Image source={{ uri: review.authorAvatar }} style={styles.avatar} contentFit="cover" />
      </TouchableOpacity>
      <View style={styles.reviewBody}>
        <View style={styles.reviewTop}>
          <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={onAuthorPress} activeOpacity={0.8}>
              <Text style={styles.author}>{review.authorName}</Text>
            </TouchableOpacity>
            <Text style={styles.time}>{review.timeAgo}</Text>
          </View>
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={12} color="#F5A623" />
            <Text style={styles.ratingText}>{review.rating.toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.serviceLine}>
          <Text style={styles.serviceLabel}>Service: </Text>
          <Text style={styles.serviceName}>{review.serviceName}</Text>
        </Text>
        <Text style={styles.body}>{review.body}</Text>
        {review.image ? (
          <Image source={{ uri: review.image }} style={styles.thumb} contentFit="cover" />
        ) : null}
      </View>
    </View>
  );
}

function ActionSheet<T>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: { label: string; value: T }[];
  selected: T;
  onSelect: (value: T) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.sheetTitle}>{title}</Text>
          {options.map((opt) => {
            const active = opt.value === selected;
            return (
              <TouchableOpacity
                key={opt.label}
                style={styles.sheetOption}
                onPress={() => onSelect(opt.value)}
              >
                <Text style={[styles.sheetOptionText, active && styles.sheetOptionActive]}>
                  {opt.label}
                </Text>
                {active ? (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  list: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xxxl,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.lg,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  distCol: {
    flex: 1,
    gap: 6,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distLabel: {
    ...typography.caption,
    color: colors.text,
    width: 10,
    fontSize: 11,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderLight,
    overflow: 'hidden',
    marginLeft: 2,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  summaryRight: {
    alignItems: 'center',
    minWidth: 88,
  },
  average: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '700',
    color: colors.primary,
  },
  summaryStars: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  summaryCount: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.borderLight,
  },
  reviewBody: {
    flex: 1,
    gap: 4,
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  author: {
    ...typography.label,
    color: colors.text,
    fontWeight: '600',
  },
  time: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  serviceLine: {
    marginTop: 2,
  },
  serviceLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '500',
  },
  serviceName: {
    ...typography.caption,
    color: '#486581',
  },
  body: {
    ...typography.caption,
    color: colors.textTertiary,
    lineHeight: 18,
    marginTop: 2,
  },
  thumb: {
    width: 72,
    height: 56,
    borderRadius: 8,
    marginTop: spacing.sm,
    backgroundColor: colors.borderLight,
  },
  empty: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.screen,
    paddingBottom: spacing.xxxl,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sheetOptionText: {
    ...typography.body,
    color: colors.text,
  },
  sheetOptionActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});
