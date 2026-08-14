import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { colors, spacing, radius, typography } from '../../theme';
import { toImageSource } from '../../utils/image';
import { UserJob, UserJobSection } from '../../data/types/userJobs';
import { TabScreenProps } from '../../navigation/types';
import { useUserJobs } from '../../context/UserJobsContext';
import { useMyProfile } from '../../context/ProfileContext';
import { openUserProfile } from '../../utils/openUserProfile';

type JobsTab = 'received' | 'sent';
type SectionSort = 'most-recent' | 'oldest' | 'due-date';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PANEL_WIDTH = SCREEN_WIDTH - spacing.screen * 2;
const SECTION_BODY_MIN_HEIGHT = 220;

interface SectionSpec {
  key: UserJobSection;
  title: string;
  dot: string;
  countColor: string;
  emptyMessage: string;
}

const RECEIVED_SECTIONS: SectionSpec[] = [
  {
    key: 'requests',
    title: 'Requests',
    dot: '#C084FC',
    countColor: '#8B5CF6',
    emptyMessage: 'No requests yet.',
  },
  {
    key: 'pending-payment',
    title: 'Pending Payment',
    dot: '#60A5FA',
    countColor: '#2E6AC5',
    emptyMessage: 'No pending payments.',
  },
  {
    key: 'in-progress',
    title: 'In Progress',
    dot: '#60A5FA',
    countColor: '#3B82F6',
    emptyMessage: 'No jobs in progress.',
  },
  {
    key: 'completed',
    title: 'History',
    dot: '#22C55E',
    countColor: '#16A34A',
    emptyMessage: 'No history yet.',
  },
];

const SENT_SECTIONS: SectionSpec[] = [
  {
    key: 'requests',
    title: 'Requests',
    dot: '#C084FC',
    countColor: '#8B5CF6',
    emptyMessage: 'No requests yet.',
  },
  {
    key: 'pending-payment',
    title: 'Pending Payment',
    dot: '#60A5FA',
    countColor: '#2E6AC5',
    emptyMessage: 'No pending payments.',
  },
  {
    key: 'in-progress',
    title: 'In Progress',
    dot: '#60A5FA',
    countColor: '#3B82F6',
    emptyMessage: 'No jobs in progress.',
  },
  {
    key: 'posted',
    title: 'Posted Jobs',
    dot: '#F59E0B',
    countColor: '#B45309',
    emptyMessage: 'No posted jobs.',
  },
  {
    key: 'completed',
    title: 'History',
    dot: '#22C55E',
    countColor: '#16A34A',
    emptyMessage: 'No history yet.',
  },
];

function sortJobs(items: UserJob[], sort: SectionSort) {
  const copy = [...items];
  if (sort === 'most-recent') {
    return copy.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }
  if (sort === 'oldest') {
    return copy.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  }
  return copy.sort((a, b) => {
    const aDate = Date.parse(a.dueDate ?? a.date);
    const bDate = Date.parse(b.dueDate ?? b.date);
    if (Number.isNaN(aDate)) return 1;
    if (Number.isNaN(bDate)) return -1;
    return aDate - bDate;
  });
}

function getStatusTone(status: UserJob['status']) {
  switch (status) {
    case 'pending':
      return { bg: '#FCE7F3', text: '#BE185D' };
    case 'changes-requested':
      return { bg: '#FEF9C3', text: '#8A6A16' };
    case 'changes-declined':
      return { bg: '#FFEDD5', text: '#C2410C' };
    case 'pending-payment':
      return { bg: '#E0ECFF', text: '#2E6AC5' };
    case 'rejected':
      return { bg: '#FEE2E2', text: '#B91C1C' };
    case 'withdrawn':
      return { bg: '#EEF2F6', text: colors.textSecondary };
    case 'in-progress':
    case 'delivered':
      return { bg: '#DBEAFE', text: '#1D4ED8' };
    case 'completed':
      return { bg: '#DCFCE7', text: '#15803D' };
    default:
      return { bg: '#EEF2F6', text: colors.textSecondary };
  }
}

function SectionBodyState({
  children,
}: {
  children: React.ReactNode;
}) {
  return <View style={styles.sectionBody}>{children}</View>;
}

function JobFlowCard({
  job,
  onPress,
  onCounterpartPress,
  onStarPress,
  hideStatus,
  showReviewPrompt,
}: {
  job: UserJob;
  onPress: () => void;
  onCounterpartPress: () => void;
  onStarPress?: (rating: number) => void;
  hideStatus?: boolean;
  showReviewPrompt?: boolean;
}) {
  const tone = getStatusTone(job.status);
  const showStars = showReviewPrompt || !!job.rating;
  const [previewRating, setPreviewRating] = useState<number | null>(null);
  const navigateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (navigateTimer.current) clearTimeout(navigateTimer.current);
    };
  }, []);

  const displayedRating = previewRating ?? job.rating ?? 0;

  const handleStarPress = (value: number) => {
    setPreviewRating(value);
    if (navigateTimer.current) clearTimeout(navigateTimer.current);
    navigateTimer.current = setTimeout(() => {
      onStarPress?.(value);
    }, 220);
  };

  return (
    <TouchableOpacity
      style={styles.receivedJobCard}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.badgeRow}>
        <View style={styles.sourceBadge}>
          <Text style={styles.sourceBadgeText}>{job.sourceLabel}</Text>
        </View>
        {job.unread ? <View style={styles.unreadDot} /> : null}
      </View>

      <View style={styles.receivedTopRow}>
        <Text style={styles.jobTitle} numberOfLines={1}>
          {job.title}
        </Text>
        <View style={styles.statusAndChevron}>
          {!hideStatus ? (
            <View style={[styles.statusBadge, { backgroundColor: tone.bg }]}>
              <Text style={[styles.statusText, { color: tone.text }]}>
                {job.statusLabel}
              </Text>
            </View>
          ) : null}
          <Ionicons name="chevron-forward" size={16} color={colors.border} />
        </View>
      </View>

      <View style={styles.metaLine}>
        <Text style={styles.metaLabel}>User</Text>
        <TouchableOpacity
          style={styles.userInline}
          onPress={(e) => {
            e.stopPropagation?.();
            onCounterpartPress();
          }}
          activeOpacity={0.8}
        >
          <Image
            source={toImageSource(job.counterpart.avatar)}
            style={styles.userAvatar}
            contentFit="cover"
          />
          <Text style={styles.metaValue}>{job.counterpart.name}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.metaSeparator} />
      <View style={styles.metaLine}>
        <Text style={styles.metaLabel}>Requested</Text>
        <View style={styles.userInline}>
          <Ionicons name="time-outline" size={14} color="#3F78B7" />
          <Text style={styles.dateValue}>{job.date}</Text>
        </View>
      </View>
      {job.activityLabel ? (
        <>
          <View style={styles.metaSeparator} />
          <View style={styles.metaLine}>
            <Text style={styles.metaLabel}>{job.activityLabel}</Text>
            <Text style={styles.activityValue}>{job.activityValue ?? ''}</Text>
          </View>
        </>
      ) : null}
      {showStars ? (
        <>
          <View style={styles.metaSeparator} />
          <View style={styles.reviewStars}>
            {Array.from({ length: 5 }).map((_, i) => {
              const value = i + 1;
              const filled = displayedRating >= value;
              return (
                <TouchableOpacity
                  key={value}
                  hitSlop={8}
                  activeOpacity={0.75}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    handleStarPress(value);
                  }}
                >
                  <Ionicons
                    name="star"
                    size={22}
                    color={filled ? colors.warning : colors.border}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      ) : null}
    </TouchableOpacity>
  );
}

export default function JobsScreen({
  navigation,
  route,
}: TabScreenProps<'JobsTab'>) {
  const { jobs: userJobs, loading, error, unread, refresh } = useUserJobs();
  const { user: me } = useMyProfile();
  /** Canonical default: always open on Received unless a landing override is set. */
  const [activeTab, setActiveTab] = useState<JobsTab>('received');
  const [activePage, setActivePage] = useState(0);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortSection, setSortSection] = useState<UserJobSection>('requests');
  const [sectionSort, setSectionSort] = useState<
    Record<UserJobSection, SectionSort>
  >({
    requests: 'most-recent',
    'pending-payment': 'most-recent',
    'in-progress': 'most-recent',
    completed: 'most-recent',
    posted: 'most-recent',
  });
  const pagerRef = useRef<ScrollView>(null);
  const pendingSection = useRef<UserJobSection | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      const landing = route.params;
      if (landing?.tab === 'sent' || landing?.tab === 'received') {
        setActiveTab(landing.tab);
      } else {
        setActiveTab('received');
        setActivePage(0);
      }
      if (landing?.section) {
        pendingSection.current = landing.section;
      }
      if (landing?.tab || landing?.section) {
        navigation.setParams({ tab: undefined, section: undefined });
      }
    }, [refresh, route.params, navigation]),
  );

  const sections = activeTab === 'received' ? RECEIVED_SECTIONS : SENT_SECTIONS;

  useEffect(() => {
    const target = pendingSection.current;
    if (!target) return;
    const idx = sections.findIndex((s) => s.key === target);
    if (idx < 0) return;
    pendingSection.current = null;
    setActivePage(idx);
    requestAnimationFrame(() => {
      pagerRef.current?.scrollTo({
        x: idx * (PANEL_WIDTH + spacing.md),
        animated: false,
      });
    });
  }, [activeTab, sections, userJobs.length]);

  const sectioned = useMemo(() => {
    const scoped = userJobs.filter((j) => j.type === activeTab);
    const result = {} as Record<UserJobSection, UserJob[]>;
    sections.forEach((section) => {
      result[section.key] = sortJobs(
        scoped.filter((j) => j.section === section.key),
        sectionSort[section.key],
      );
    });
    return result;
  }, [userJobs, activeTab, sections, sectionSort]);

  const openJob = (job: UserJob) => {
    if (job.section === 'posted' && job.listingId) {
      navigation.navigate('JobListingDetail', { listingId: job.listingId });
      return;
    }
    if (job.requestId) {
      navigation.navigate('WorkRequestDetail', { requestId: job.requestId });
    }
  };

  const showSectionLoading = loading && userJobs.length === 0;
  const showSectionError = Boolean(error) && !showSectionLoading;

  return (
    <ScreenContainer padded={false}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Jobs</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabBar}>
        {(['received', 'sent'] as JobsTab[]).map((tab) => {
          const count = tab === 'received' ? unread.received : unread.sent;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => {
                setActiveTab(tab);
                setActivePage(0);
              }}
            >
              <View style={styles.tabLabelRow}>
                <Text
                  style={[styles.tabText, activeTab === tab && styles.tabTextActive]}
                >
                  {tab === 'received' ? 'Received' : 'Sent'}
                </Text>
                {count > 0 ? <View style={styles.tabUnreadDot} /> : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        // Remount per tab so the pager starts on the first section again.
        key={activeTab}
        ref={pagerRef}
        horizontal
        pagingEnabled
        snapToInterval={PANEL_WIDTH + spacing.md}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pager}
        onScroll={(e) => {
          const x = e.nativeEvent.contentOffset.x;
          const page = Math.round(x / (PANEL_WIDTH + spacing.md));
          setActivePage(Math.max(0, Math.min(sections.length - 1, page)));
        }}
        scrollEventThrottle={16}
      >
        {sections.map((section) => {
          const items = sectioned[section.key] ?? [];
          return (
            <View key={section.key} style={styles.panel}>
              <View style={styles.panelHeader}>
                <View style={styles.panelTitleWrap}>
                  <View style={[styles.panelDot, { backgroundColor: section.dot }]} />
                  <Text style={styles.panelTitle}>{section.title}</Text>
                  <Text style={[styles.panelCount, { color: section.countColor }]}>
                    {showSectionLoading || showSectionError ? '—' : items.length}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.panelFilter}
                  onPress={() => {
                    setSortSection(section.key);
                    setSortOpen(true);
                  }}
                >
                  <Ionicons
                    name="filter-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {showSectionLoading ? (
                  <SectionBodyState>
                    <ActivityIndicator color={colors.primary} size="large" />
                  </SectionBodyState>
                ) : showSectionError ? (
                  <SectionBodyState>
                    <Ionicons
                      name="warning-outline"
                      size={28}
                      color={colors.error}
                    />
                    <Text style={styles.errorTitle}>
                      Couldn&apos;t load your {section.title.toLowerCase()}.
                    </Text>
                    <Text style={styles.errorSubtitle}>Please try again.</Text>
                    <TouchableOpacity
                      style={styles.retryBtn}
                      onPress={() => void refresh()}
                    >
                      <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                  </SectionBodyState>
                ) : items.length === 0 ? (
                  <SectionBodyState>
                    <Text style={styles.emptyText}>{section.emptyMessage}</Text>
                  </SectionBodyState>
                ) : (
                  items.map((job) => (
                    <JobFlowCard
                      key={job.id}
                      job={job}
                      hideStatus={section.key === 'posted'}
                      showReviewPrompt={
                        section.key === 'completed' && job.status === 'completed'
                      }
                      onPress={() => openJob(job)}
                      onCounterpartPress={() =>
                        openUserProfile(navigation, job.counterpart.id, me.id)
                      }
                      onStarPress={() =>
                        navigation.navigate('WriteReview', {
                          jobId: job.id,
                        })
                      }
                    />
                  ))
                )}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.dotsRow}>
        {sections.map((s, i) => (
          <View key={s.key} style={[styles.dot, i === activePage && styles.dotActive]} />
        ))}
      </View>

      <Modal
        visible={sortOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSortOpen(false)}
      >
        <Pressable style={styles.sortBackdrop} onPress={() => setSortOpen(false)}>
          <Pressable style={styles.sortSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sortTitle}>
              Sort {sections.find((s) => s.key === sortSection)?.title ?? ''}
            </Text>
            {(
              [
                { id: 'most-recent', label: 'Most recent' },
                { id: 'oldest', label: 'Oldest first' },
                { id: 'due-date', label: 'Due date' },
              ] as { id: SectionSort; label: string }[]
            ).map((opt) => {
              const selected = sectionSort[sortSection] === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={styles.sortOption}
                  onPress={() => {
                    setSectionSort((prev) => ({ ...prev, [sortSection]: opt.id }));
                    setSortOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      selected && styles.sortOptionTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {selected ? (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  tabLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tabText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  tabUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  pager: {
    paddingHorizontal: spacing.screen,
    paddingRight: spacing.screen,
    gap: spacing.md,
  },
  panel: {
    width: PANEL_WIDTH,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    maxHeight: 560,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  panelTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  panelDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  panelTitle: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  panelCount: {
    ...typography.label,
  },
  panelFilter: {
    width: 36,
    height: 36,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  sectionBody: {
    minHeight: SECTION_BODY_MIN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    textAlign: 'center',
  },
  errorSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    backgroundColor: colors.primary + '14',
  },
  retryText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  receivedJobCard: {
    borderRadius: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  reviewStars: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  badgeRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sourceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: '#EEF2F6',
  },
  sourceBadgeText: {
    ...typography.caption,
    fontSize: 10,
    letterSpacing: 0.6,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  receivedTopRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  statusAndChevron: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  jobTitle: {
    ...typography.h3,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.button,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '500',
  },
  metaLine: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 24,
  },
  metaSeparator: {
    width: '100%',
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.xs,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  userInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  userAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  metaValue: {
    ...typography.bodySmall,
    color: colors.text,
  },
  dateValue: {
    ...typography.bodySmall,
    color: '#3F78B7',
  },
  activityValue: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: 78,
    zIndex: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D6DEE8',
  },
  dotActive: {
    width: 34,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  sortBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sortSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: spacing.screen,
    paddingBottom: spacing.xxl,
  },
  sortTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sortOptionText: {
    ...typography.body,
    color: colors.text,
  },
  sortOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});
