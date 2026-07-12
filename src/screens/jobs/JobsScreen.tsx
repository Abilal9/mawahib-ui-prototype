import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import JobsFilterSheet, {
  JobsFilters,
  defaultJobsFilters,
} from '../../components/explore/JobsFilterSheet';
import { colors, spacing, radius, typography } from '../../theme';
import { toImageSource } from '../../utils/image';
import { userJobs } from '../../data/mock/userJobs';
import { UserJob } from '../../data/types/userJobs';
import { TabScreenProps } from '../../navigation/types';

type JobsTab = 'received' | 'sent';

function parseDate(date: string) {
  return Date.parse(date);
}

function sortJobsList(items: UserJob[], sort: JobsFilters['sort']) {
  const copy = [...items];
  if (sort === 'oldest') {
    return copy.sort((a, b) => parseDate(a.date) - parseDate(b.date));
  }
  if (sort === 'due-date') {
    return copy.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return parseDate(a.dueDate) - parseDate(b.dueDate);
    });
  }
  return copy.sort((a, b) => parseDate(b.date) - parseDate(a.date));
}

function organizeJobs(items: UserJob[], tab: JobsTab) {
  if (tab === 'received') {
    return {
      requests: items.filter((j) => j.status === 'pending'),
      inProgress: items.filter((j) => j.status === 'in-progress'),
      history: [] as UserJob[],
    };
  }

  return {
    requests: items.filter((j) => j.status === 'sent'),
    inProgress: items.filter((j) => j.status === 'in-progress'),
    history: items.filter((j) => j.status === 'completed' || j.status === 'declined'),
  };
}

function JobCard({ job, onPress }: { job: UserJob; onPress: () => void }) {
  const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: '#FFF3E0', text: '#E65100' },
    sent: { bg: '#E3F2FD', text: '#1565C0' },
    'in-progress': { bg: '#E8F5E9', text: '#2E7D32' },
    completed: { bg: '#F3E5F5', text: '#7B1FA2' },
    declined: { bg: '#FFEBEE', text: '#C62828' },
  };
  const badge = statusColors[job.status] ?? statusColors.pending;

  return (
    <TouchableOpacity style={styles.jobCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.jobCardTop}>
        <Text style={styles.jobTitle} numberOfLines={1}>
          {job.title}
        </Text>
        {job.jobType && (
          <View style={styles.jobTypeBadge}>
            <Text style={styles.jobTypeText}>{job.jobType}</Text>
          </View>
        )}
      </View>

      <View style={styles.jobMeta}>
        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.statusText, { color: badge.text }]}>{job.statusLabel}</Text>
        </View>
        <Text style={styles.jobDate}>{job.date}</Text>
      </View>

      <View style={styles.counterpartRow}>
        <Image
          source={toImageSource(job.counterpart.avatar)}
          style={styles.counterpartAvatar}
          contentFit="cover"
        />
        <View style={styles.counterpartInfo}>
          <Text style={styles.counterpartLabel}>
            {job.type === 'received' ? 'From' : 'To'}
          </Text>
          <Text style={styles.counterpartName}>{job.counterpart.name}</Text>
        </View>
        {job.dueDate && (
          <View style={styles.dueDate}>
            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.dueDateText}>{job.dueDate}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function JobSection({
  title,
  jobs,
  onJobPress,
}: {
  title: string;
  jobs: UserJob[];
  onJobPress: (job: UserJob) => void;
}) {
  if (jobs.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} onPress={() => onJobPress(job)} />
      ))}
    </View>
  );
}

export default function JobsScreen({ navigation }: TabScreenProps<'JobsTab'>) {
  const [activeTab, setActiveTab] = useState<JobsTab>('received');
  const [filters, setFilters] = useState<JobsFilters>(defaultJobsFilters);
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = useMemo(() => {
    let items = userJobs.filter((j) => j.type === activeTab);
    if (filters.status !== 'all') {
      items = items.filter((j) => j.status === filters.status);
    }
    return sortJobsList(items, filters.sort);
  }, [activeTab, filters]);

  const { requests, inProgress, history } = organizeJobs(filtered, activeTab);

  return (
    <ScreenContainer>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Jobs</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterOpen(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {(['received', 'sent'] as JobsTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'received' ? 'Received' : 'Sent'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="briefcase-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No jobs yet</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'received'
                ? 'Job requests you receive will appear here.'
                : 'Jobs you send will appear here.'}
            </Text>
          </View>
        ) : (
          <>
            <JobSection
              title="Job requests"
              jobs={requests}
              onJobPress={(job) => navigation.navigate('JobInProgress', { jobId: job.id })}
            />
            <JobSection
              title="In progress"
              jobs={inProgress}
              onJobPress={(job) => navigation.navigate('JobInProgress', { jobId: job.id })}
            />
            {history.length > 0 && (
              <JobSection
                title="History"
                jobs={history}
                onJobPress={(job) => navigation.navigate('JobInProgress', { jobId: job.id })}
              />
            )}
          </>
        )}
      </ScrollView>

      <JobsFilterSheet
        visible={filterOpen}
        filters={filters}
        onClose={() => setFilterOpen(false)}
        onApply={setFilters}
        onReset={() => setFilters(defaultJobsFilters)}
      />
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
  filterButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.button,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.screen,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.button,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderRadius: radius.button,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.white,
  },
  scroll: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  jobCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  jobCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  jobTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  jobTypeBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.button,
  },
  jobTypeText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.button,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  jobDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  counterpartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  counterpartAvatar: {
    width: 32,
    height: 32,
    borderRadius: radius.avatar,
  },
  counterpartInfo: {
    flex: 1,
  },
  counterpartLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  counterpartName: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  dueDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDateText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
