import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import ExploreFilterSheet from '../../components/explore/ExploreFilterSheet';
import { toImageSource } from '../../utils/image';
import { colors, spacing, radius, typography } from '../../theme';
import { talents, recentSearches } from '../../data/mock/talents';
import { jobs } from '../../data/mock/jobs';
import { services } from '../../data/mock/services';
import { posts } from '../../data/mock/posts';
import {
  exploreCategories,
  exploreContentTypes,
  ExploreCategory,
  ExploreContentType,
  defaultExploreFilters,
} from '../../data/mock/explore';
import {
  filterJobs,
  filterPosts,
  filterServices,
  filterTalents,
  getExploreSectionTitle,
} from '../../utils/explore';
import { TabScreenProps } from '../../navigation/types';
import { Job, Post, Service, Talent } from '../../data/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const POST_ITEM = (SCREEN_WIDTH - spacing.screen * 2 - spacing.sm) / 2;

export default function SearchScreen({ navigation, route }: TabScreenProps<'SearchTab'>) {
  const [query, setQuery] = useState('');
  const [searches, setSearches] = useState(recentSearches);
  const [category, setCategory] = useState<ExploreCategory>(
    (route.params?.category as ExploreCategory) ?? 'All'
  );
  const [contentType, setContentType] = useState<ExploreContentType>(
    route.params?.contentType ?? 'all'
  );
  const [filters, setFilters] = useState(defaultExploreFilters);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    if (route.params?.contentType) setContentType(route.params.contentType);
    if (route.params?.category) setCategory(route.params.category as ExploreCategory);
  }, [route.params?.contentType, route.params?.category]);

  const talentResults = useMemo(
    () => filterTalents(talents, query, category, filters),
    [query, category, filters]
  );
  const jobResults = useMemo(
    () => filterJobs(jobs, query, category, filters),
    [query, category, filters]
  );
  const serviceResults = useMemo(
    () => filterServices(services, query, category, filters),
    [query, category, filters]
  );
  const postResults = useMemo(
    () => filterPosts(posts, query, category, filters),
    [query, category, filters]
  );

  const hasResults =
    talentResults.length + jobResults.length + serviceResults.length + postResults.length > 0;

  const removeSearch = (term: string) => setSearches((prev) => prev.filter((s) => s !== term));

  const showSection = (type: ExploreContentType) =>
    contentType === 'all' || contentType === type;

  return (
    <ScreenContainer padded={false}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Explore</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterOpen(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchField}
            placeholder="Search talents, jobs, services..."
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {exploreCategories.map((item) => {
          const selected = category === item;
          return (
            <TouchableOpacity
              key={item}
              style={[styles.categoryChip, selected && styles.categoryChipActive]}
              onPress={() => setCategory(item)}
              activeOpacity={0.8}
            >
              <Text style={[styles.categoryText, selected && styles.categoryTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.contentTabs}>
        {exploreContentTypes.map((tab) => {
          const selected = contentType === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.contentTab, selected && styles.contentTabActive]}
              onPress={() => setContentType(tab.id)}
            >
              <Text style={[styles.contentTabText, selected && styles.contentTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {!query && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent searches</Text>
            {searches.map((term) => (
              <TouchableOpacity
                key={term}
                style={styles.recentItem}
                onPress={() => setQuery(term)}
                activeOpacity={0.8}
              >
                <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.recentText}>{term}</Text>
                <TouchableOpacity
                  onPress={() => removeSearch(term)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>{getExploreSectionTitle(contentType, query)}</Text>

        {!hasResults ? (
          <View style={styles.empty}>
            <Ionicons name="compass-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your filters or search for something else.
            </Text>
          </View>
        ) : (
          <>
            {showSection('talents') && talentResults.length > 0 && (
              <ExploreSection title={contentType === 'all' ? 'Talents' : undefined}>
                {talentResults.map((talent) => (
                  <TalentCard
                    key={talent.id}
                    talent={talent}
                    onPress={() =>
                      navigation.navigate('UserProfile', { userId: talent.user.id })
                    }
                  />
                ))}
              </ExploreSection>
            )}

            {showSection('jobs') && jobResults.length > 0 && (
              <ExploreSection title={contentType === 'all' ? 'Jobs' : undefined}>
                {jobResults.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onPress={() => navigation.navigate('JobListingDetail', { jobId: job.id })}
                  />
                ))}
              </ExploreSection>
            )}

            {showSection('services') && serviceResults.length > 0 && (
              <ExploreSection title={contentType === 'all' ? 'Services' : undefined}>
                {serviceResults.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onPress={() =>
                      navigation.navigate('ServiceDetail', { serviceId: service.id })
                    }
                  />
                ))}
              </ExploreSection>
            )}

            {showSection('posts') && postResults.length > 0 && (
              <ExploreSection title={contentType === 'all' ? 'Posts' : undefined}>
                <View style={styles.postGrid}>
                  {postResults.map((post) => (
                    <TouchableOpacity
                      key={post.id}
                      style={styles.postItem}
                      onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={{ uri: post.images[0] }}
                        style={styles.postImage}
                        contentFit="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </ExploreSection>
            )}
          </>
        )}
      </ScrollView>

      <ExploreFilterSheet
        visible={filterOpen}
        filters={filters}
        showJobType={contentType === 'jobs' || contentType === 'all'}
        onClose={() => setFilterOpen(false)}
        onApply={setFilters}
        onReset={() => setFilters(defaultExploreFilters)}
      />
    </ScreenContainer>
  );
}

function ExploreSection({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      {title ? <Text style={styles.subsectionTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

function TalentCard({ talent, onPress }: { talent: Talent; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.talentCard} onPress={onPress} activeOpacity={0.85}>
      <Image
        source={toImageSource(talent.user.avatar)}
        style={styles.talentAvatar}
        contentFit="cover"
      />
      <View style={styles.talentBody}>
        <View style={styles.talentTop}>
          <Text style={styles.talentName}>{talent.user.name}</Text>
          {talent.user.isVerified && (
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
          )}
        </View>
        <Text style={styles.talentCategory}>{talent.category}</Text>
        <View style={styles.talentMeta}>
          <Ionicons name="star" size={12} color={colors.warning} />
          <Text style={styles.talentRating}>{talent.rating}</Text>
          <Text style={styles.talentRate}>· AED {talent.hourlyRate}/hr</Text>
        </View>
        <Text style={styles.talentLocation} numberOfLines={1}>
          {talent.user.location}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

function JobCard({ job, onPress }: { job: Job; onPress: () => void }) {
  const typeLabel =
    job.type === 'part-time'
      ? 'Part-time'
      : job.type === 'full-time'
        ? 'Full-time'
        : job.type === 'contract'
          ? 'Contract'
          : 'Freelance';

  return (
    <TouchableOpacity style={styles.jobCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.jobTop}>
        {job.logo ? (
          <Image source={toImageSource(job.logo)} style={styles.jobLogo} contentFit="cover" />
        ) : (
          <View style={styles.jobLogoPlaceholder}>
            <Text style={styles.jobLogoText}>{job.company.charAt(0)}</Text>
          </View>
        )}
        <View style={styles.jobInfo}>
          <View style={styles.jobTitleRow}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <View style={styles.jobTypeBadge}>
              <Text style={styles.jobTypeText}>{typeLabel}</Text>
            </View>
          </View>
          <Text style={styles.jobCompany}>{job.company}</Text>
        </View>
      </View>
      <View style={styles.jobMetaRow}>
        <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.jobMetaText}>{job.location}</Text>
      </View>
      <View style={styles.jobMetaRow}>
        <Ionicons name="cash-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.jobMetaText}>{job.salary}</Text>
      </View>
      {job.matchScore ? (
        <View style={styles.matchBadge}>
          <Text style={styles.matchText}>{job.matchScore}% match</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function ServiceCard({ service, onPress }: { service: Service; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.serviceCard} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: service.images[0] }} style={styles.serviceImage} contentFit="cover" />
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceCategory}>{service.category}</Text>
        <Text style={styles.serviceTitle}>{service.title}</Text>
        <Text style={styles.serviceProvider}>{service.provider.name}</Text>
        <View style={styles.serviceFooter}>
          <Text style={styles.servicePrice}>
            {service.currency} {service.price.toLocaleString()}
          </Text>
          <View style={styles.serviceRating}>
            <Ionicons name="star" size={12} color={colors.warning} />
            <Text style={styles.serviceRatingText}>{service.rating}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  pageTitle: { ...typography.h2, color: colors.text },
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
  searchHeader: { paddingHorizontal: spacing.screen, paddingBottom: spacing.md },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.button,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  searchField: { flex: 1, ...typography.body, color: colors.text, paddingVertical: spacing.sm },
  categoryRow: {
    paddingHorizontal: spacing.screen,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '500' },
  categoryTextActive: { color: colors.white, fontWeight: '600' },
  contentTabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.screen,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  contentTab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  contentTabActive: { backgroundColor: '#FFF0F7' },
  contentTabText: { ...typography.caption, color: colors.textSecondary, fontWeight: '500' },
  contentTabTextActive: { color: colors.primary, fontWeight: '700' },
  content: { paddingBottom: spacing.xxxl },
  recentSection: { paddingHorizontal: spacing.screen, marginBottom: spacing.lg },
  sectionTitle: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.screen,
  },
  subsectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  recentText: { ...typography.body, color: colors.text, flex: 1 },
  section: { paddingHorizontal: spacing.screen, marginBottom: spacing.lg },
  empty: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
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
  talentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  talentAvatar: { width: 56, height: 56, borderRadius: radius.avatar },
  talentBody: { flex: 1 },
  talentTop: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  talentName: { ...typography.label, color: colors.text },
  talentCategory: { ...typography.caption, color: colors.primary, marginTop: 2 },
  talentMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  talentRating: { ...typography.caption, color: colors.text },
  talentRate: { ...typography.caption, color: colors.textSecondary },
  talentLocation: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  jobCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  jobTop: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  jobLogo: { width: 44, height: 44, borderRadius: radius.button },
  jobLogoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: radius.button,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobLogoText: { ...typography.label, color: colors.primary },
  jobInfo: { flex: 1 },
  jobTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  jobTitle: { ...typography.label, color: colors.text, flex: 1 },
  jobTypeBadge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.button,
  },
  jobTypeText: { ...typography.caption, color: '#193CB8', fontSize: 11 },
  jobCompany: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  jobMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  jobMetaText: { ...typography.caption, color: colors.textSecondary },
  matchBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  matchText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceImage: { width: 96, height: 96 },
  serviceInfo: { flex: 1, padding: spacing.md, justifyContent: 'center' },
  serviceCategory: { ...typography.caption, color: colors.primary },
  serviceTitle: { ...typography.label, color: colors.text, marginTop: 2 },
  serviceProvider: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  servicePrice: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  serviceRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  serviceRatingText: { ...typography.caption, color: colors.textSecondary },
  postGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  postItem: {
    width: POST_ITEM,
    height: POST_ITEM,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  postImage: { width: '100%', height: '100%' },
});
