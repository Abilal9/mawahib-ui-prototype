import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import ExploreFilterSheet from '../../components/explore/ExploreFilterSheet';
import { toImageSource } from '../../utils/image';
import { colors, spacing, radius, typography } from '../../theme';
import { recentSearches } from '../../data/mock/talents';
import {
  exploreTabs,
  chipsForTab,
  defaultExploreFilters,
  ExploreTab,
} from '../../data/mock/explore';
import {
  filterJobs,
  filterServices,
  filterTalents,
  normalizeExploreTab,
} from '../../utils/explore';
import { TabScreenProps } from '../../navigation/types';
import {
  Job,
  Service,
  Talent,
  TalentConnectStatus,
  ConnectionRelation,
} from '../../data/types';
import { useMyProfile } from '../../context/ProfileContext';
import { useConnections } from '../../context/ConnectionsContext';
import { catalogService, jobService } from '../../services';
import { openUserProfile } from '../../utils/openUserProfile';

function relationToConnectStatus(relation: ConnectionRelation): TalentConnectStatus {
  if (relation === 'connected') return 'added';
  if (relation === 'outgoing' || relation === 'incoming') return 'request-sent';
  return 'connect';
}

export default function SearchScreen({ navigation, route }: TabScreenProps<'SearchTab'>) {
  const { user: me } = useMyProfile();
  const { getRelation, requestConnect, cancelOutgoing, disconnect, acceptRequest } =
    useConnections();
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searches, setSearches] = useState(recentSearches);
  const [tab, setTab] = useState<ExploreTab>(
    normalizeExploreTab(route.params?.contentType)
  );
  const [chip, setChip] = useState<string | null>(null);
  const [filters, setFilters] = useState(defaultExploreFilters);
  const [filterOpen, setFilterOpen] = useState(false);

  const talents = catalogService.listTalents();
  const jobs = jobService.listSync();
  const services = catalogService.listServices();

  useEffect(() => {
    if (route.params?.contentType) {
      setTab(normalizeExploreTab(route.params.contentType));
      setChip(null);
    }
  }, [route.params?.contentType]);

  const chipOptions = chipsForTab(tab);

  const talentResults = useMemo(
    () => filterTalents(talents, query, chip, filters),
    [talents, query, chip, filters]
  );
  const jobResults = useMemo(
    () => filterJobs(jobs, query, chip, filters),
    [jobs, query, chip, filters]
  );
  const serviceResults = useMemo(
    () => filterServices(services, query, chip, filters),
    [services, query, chip, filters]
  );

  const results =
    tab === 'talents'
      ? talentResults
      : tab === 'services'
        ? serviceResults
        : jobResults;

  const removeSearch = (term: string) => setSearches((prev) => prev.filter((s) => s !== term));

  const handleConnect = (userId: string) => {
    const relation = getRelation(userId);
    if (relation === 'none') {
      requestConnect(userId);
      return;
    }
    if (relation === 'outgoing') {
      cancelOutgoing(userId);
      return;
    }
    if (relation === 'incoming') {
      acceptRequest(userId);
      return;
    }
    if (relation === 'connected') {
      disconnect(userId);
    }
  };

  return (
    <ScreenContainer padded={false}>
      <StatusBar style="dark" />

      <View style={styles.topBar}>
        {searchOpen ? (
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={styles.searchField}
              placeholder={`Search ${tab}...`}
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                setSearchOpen(false);
                setQuery('');
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.pageTitle}>Explore</Text>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setSearchOpen(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="search-outline" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.mainTabs}>
        {exploreTabs.map((item) => {
          const selected = tab === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.mainTab, selected && styles.mainTabActive]}
              onPress={() => {
                setTab(item.id);
                setChip(null);
              }}
              activeOpacity={0.85}
            >
              <Text style={[styles.mainTabText, selected && styles.mainTabTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterIconBtn}
          onPress={() => setFilterOpen(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={18} color={colors.text} />
        </TouchableOpacity>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScroll}
        >
          {chipOptions.map((item) => {
            const selected = chip === item;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, selected && styles.chipActive]}
                onPress={() => setChip(selected ? null : item)}
                activeOpacity={0.85}
              >
                <Text style={[styles.chipText, selected && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {searchOpen && !query ? (
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>Recent searches</Text>
            {searches.map((term) => (
              <TouchableOpacity
                key={term}
                style={styles.recentItem}
                onPress={() => setQuery(term)}
                activeOpacity={0.8}
              >
                <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.recentText}>{term}</Text>
                <TouchableOpacity onPress={() => removeSearch(term)}>
                  <Ionicons name="close" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {results.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="compass-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your filters or search for something else.
            </Text>
          </View>
        ) : (
          <>
            {tab === 'talents' &&
              talentResults.map((talent) => (
                <TalentCard
                  key={talent.id}
                  talent={talent}
                  connectStatus={relationToConnectStatus(getRelation(talent.user.id))}
                  onPress={() => openUserProfile(navigation, talent.user.id, me.id)}
                  onConnect={() => handleConnect(talent.user.id)}
                />
              ))}

            {tab === 'services' &&
              serviceResults.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onPress={() =>
                    navigation.navigate('ServiceDetail', { serviceId: service.id })
                  }
                  onProviderPress={() =>
                    openUserProfile(navigation, service.provider.id, me.id)
                  }
                />
              ))}

            {tab === 'jobs' &&
              jobResults.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onPress={() => navigation.navigate('JobListingDetail', { jobId: job.id })}
                />
              ))}
          </>
        )}
      </ScrollView>

      <ExploreFilterSheet
        visible={filterOpen}
        filters={filters}
        showJobType={tab === 'jobs'}
        onClose={() => setFilterOpen(false)}
        onApply={setFilters}
        onReset={() => setFilters(defaultExploreFilters)}
      />
    </ScreenContainer>
  );
}

function TalentCard({
  talent,
  connectStatus,
  onPress,
  onConnect,
}: {
  talent: Talent;
  connectStatus: TalentConnectStatus;
  onPress: () => void;
  onConnect: () => void;
}) {
  const connectStyle =
    connectStatus === 'added'
      ? styles.connectAdded
      : connectStatus === 'request-sent'
        ? styles.connectPending
        : styles.connectDefault;
  const connectIcon: keyof typeof Ionicons.glyphMap =
    connectStatus === 'added'
      ? 'checkmark'
      : connectStatus === 'request-sent'
        ? 'arrow-forward'
        : 'person-add-outline';

  return (
    <TouchableOpacity style={styles.talentCard} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.talentRow}>
        <Image
          source={toImageSource(talent.user.avatar)}
          style={styles.talentAvatar}
          contentFit="cover"
        />
        <View style={styles.talentBody}>
          <View style={styles.nameRow}>
            <Text style={styles.talentName}>{talent.user.name}</Text>
            {talent.user.isVerified ? (
              <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            ) : null}
          </View>
          <Text style={styles.talentTitle}>{talent.user.title ?? talent.category}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={colors.text} />
            <Text style={styles.metaText}>{talent.user.location}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="cash-outline" size={14} color={colors.text} />
            <Text style={styles.metaText}>
              {talent.rateLabel ?? `${talent.hourlyRate} / hr`}
            </Text>
          </View>
          {(talent.mutualConnections ?? 0) > 0 ? (
            <View style={styles.mutualRow}>
              <View style={styles.mutualAvatars}>
                {(talent.mutualAvatars ?? []).slice(0, 3).map((avatar, index) => (
                  <Image
                    key={`${talent.id}-m-${index}`}
                    source={toImageSource(avatar)}
                    style={[styles.mutualAvatar, { marginLeft: index === 0 ? 0 : -6, zIndex: 3 - index }]}
                    contentFit="cover"
                  />
                ))}
              </View>
              <Text style={styles.mutualText}>
                {talent.mutualConnections} mutual connections
              </Text>
            </View>
          ) : null}
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={colors.warning} />
            <Text style={styles.ratingValue}>{talent.rating.toFixed(1)}</Text>
            <Text style={styles.ratingCount}>({talent.reviewCount ?? 0})</Text>
          </View>
        </View>
        <View style={styles.talentActions}>
          <TouchableOpacity
            style={[styles.connectBtn, connectStyle]}
            onPress={onConnect}
            activeOpacity={0.85}
          >
            <Ionicons name={connectIcon} size={16} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity hitSlop={8} onPress={() => {}} style={styles.menuBtn}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ServiceCard({
  service,
  onPress,
  onProviderPress,
}: {
  service: Service;
  onPress: () => void;
  onProviderPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.serviceCard} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.serviceImageWrap}>
        <Image
          source={{ uri: service.images[0] }}
          style={styles.serviceImage}
          contentFit="cover"
        />
        {service.images.length > 1 ? (
          <View style={styles.dots}>
            {service.images.slice(0, 3).map((_, i) => (
              <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
            ))}
          </View>
        ) : null}
      </View>
      <View style={styles.serviceBody}>
        <View style={styles.serviceTitleRow}>
          <Text style={styles.serviceTitle} numberOfLines={1}>
            {service.title}
          </Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={colors.warning} />
            <Text style={styles.ratingValue}>{service.rating.toFixed(1)}</Text>
            <Text style={styles.ratingCount}>({service.reviewCount})</Text>
          </View>
        </View>
        <Text style={styles.serviceDesc} numberOfLines={2}>
          {service.description}
        </Text>
        <TouchableOpacity
          style={styles.providerRow}
          onPress={onProviderPress}
          activeOpacity={0.85}
        >
          <Image
            source={toImageSource(service.provider.avatar)}
            style={styles.providerAvatar}
            contentFit="cover"
          />
          <Text style={styles.providerName}>{service.provider.name}</Text>
          {service.provider.isVerified ? (
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
          ) : null}
        </TouchableOpacity>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
          <Text style={styles.serviceMeta}>{service.duration}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="cash-outline" size={14} color={colors.textTertiary} />
          <Text style={styles.serviceMeta}>
            {service.priceLabel ?? `${service.currency} ${service.price.toLocaleString()}`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function JobCard({ job, onPress }: { job: Job; onPress: () => void }) {
  const badge = jobTypeBadge(job.type);

  return (
    <TouchableOpacity style={styles.jobCard} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.jobLogoWrap}>
        {job.logo ? (
          <Image source={toImageSource(job.logo)} style={styles.jobLogo} contentFit="cover" />
        ) : (
          <Text style={styles.jobLogoText}>{job.company.charAt(0)}</Text>
        )}
      </View>
      <View style={styles.jobBody}>
        <Text style={styles.jobTitle}>{job.title}</Text>
        <Text style={styles.jobCompany}>{job.company}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
          <Text style={styles.jobMeta}>{job.location}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="cash-outline" size={14} color={colors.textTertiary} />
          <Text style={styles.jobMeta}>{job.salary}</Text>
        </View>
      </View>
      <View style={[styles.jobBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
        <Text style={[styles.jobBadgeText, { color: badge.text }]}>{badge.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

function jobTypeBadge(type: Job['type']) {
  if (type === 'part-time') {
    return { label: 'Part-time', bg: '#EFF6FF', border: '#DBEAFE', text: '#193CB8' };
  }
  if (type === 'full-time') {
    return { label: 'Full-time', bg: '#FEFCE8', border: '#FEF9C2', text: '#894B00' };
  }
  if (type === 'gig' || type === 'freelance') {
    return { label: type === 'gig' ? 'Gig' : 'Freelance', bg: '#F0FDF4', border: '#DCFCE7', text: '#016630' };
  }
  return { label: 'Contract', bg: '#FDF2F8', border: '#FCE7F3', text: colors.primary };
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    minHeight: 48,
  },
  pageTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: colors.text,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    height: 40,
  },
  searchField: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.text,
    paddingVertical: 0,
  },
  cancelText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  mainTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mainTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  mainTabActive: {
    borderBottomColor: colors.primary,
  },
  mainTabText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  mainTabTextActive: {
    color: colors.primary,
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.screen,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  filterIconBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipScroll: {
    gap: spacing.sm,
    paddingRight: spacing.screen,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.caption,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    paddingBottom: 120,
    gap: spacing.xl,
  },
  recentSection: { marginBottom: spacing.sm },
  recentTitle: { ...typography.label, color: colors.text, marginBottom: spacing.sm },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  recentText: { ...typography.body, color: colors.text, flex: 1 },
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
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
      },
      android: { elevation: 1 },
    }),
  },
  talentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  talentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 0.9,
    borderColor: colors.white,
    backgroundColor: '#FDF2F8',
  },
  talentBody: { flex: 1, gap: spacing.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  talentName: { ...typography.bodyMedium, color: colors.text, fontWeight: '500' },
  talentTitle: { ...typography.caption, color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...typography.caption, color: colors.text },
  mutualRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mutualAvatars: { flexDirection: 'row', alignItems: 'center' },
  mutualAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: colors.white,
  },
  mutualText: { fontSize: 11, lineHeight: 14, color: colors.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingValue: { ...typography.caption, color: colors.text },
  ratingCount: { ...typography.caption, color: '#829AB1' },
  talentActions: { alignItems: 'center', gap: 2 },
  connectBtn: {
    width: 31,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.white,
  },
  connectDefault: {
    backgroundColor: colors.primary,
  },
  connectAdded: {
    backgroundColor: '#00A63E',
  },
  connectPending: {
    backgroundColor: '#BCCCDC',
  },
  menuBtn: {
    padding: spacing.sm,
  },
  serviceCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
      },
      android: { elevation: 1 },
    }),
  },
  serviceImageWrap: {
    height: 205,
    backgroundColor: colors.borderLight,
  },
  serviceImage: { width: '100%', height: '100%' },
  dots: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: { backgroundColor: colors.white },
  serviceBody: {
    padding: spacing.md,
    gap: spacing.md,
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  serviceTitle: {
    flex: 1,
    ...typography.bodyMedium,
    fontWeight: '500',
    color: colors.text,
  },
  serviceDesc: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  providerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  providerName: {
    fontSize: 11,
    lineHeight: 14,
    color: colors.text,
  },
  serviceMeta: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  jobCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
      },
      android: { elevation: 1 },
    }),
  },
  jobLogoWrap: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobLogo: { width: 32, height: 32, borderRadius: 8 },
  jobLogoText: { ...typography.label, color: colors.primary },
  jobBody: { flex: 1, gap: spacing.sm },
  jobTitle: { ...typography.bodyMedium, fontWeight: '500', color: colors.text },
  jobCompany: { ...typography.caption, color: colors.text },
  jobMeta: { ...typography.caption, color: colors.textTertiary },
  jobBadge: {
    borderWidth: 1,
    borderRadius: radius.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  jobBadgeText: { fontSize: 11, lineHeight: 14 },
});
