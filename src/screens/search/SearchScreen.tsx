import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import ConfirmActionModal from '../../components/ui/ConfirmActionModal';
import { listPaddingAboveTabBar } from '../../components/layout/CustomTabBar';
import ExploreFilterSheet, {
  ExploreSheetValue,
  locationLabel,
} from '../../components/explore/ExploreFilterSheet';
import ExploreTaxonomyFilters from '../../components/explore/ExploreTaxonomyFilters';
import ServiceMediaMosaic from '../../components/explore/ServiceMediaMosaic';
import { toImageSource } from '../../utils/image';
import UserAvatar from '../../components/ui/UserAvatar';
import { colors, spacing, radius, typography } from '../../theme';
import MoneyAmount from '../../components/ui/MoneyAmount';
import { serviceDetailRoute } from '../../domain/truthfulFacts';
import { stripCurrencyCodeTokens } from '../../utils/money';
import { exploreTabs, ExploreTab } from '../../data/mock/explore';
import { normalizeExploreTab } from '../../utils/explore';
import { TabScreenProps } from '../../navigation/types';
import { displayProfileTitle } from '../../constants/profile';
import {
  Job,
  Service,
  Talent,
  TalentConnectStatus,
  ConnectionRelation,
} from '../../data/types';
import { useMyProfile } from '../../context/ProfileContext';
import { useSaved } from '../../context/SavedContext';
import BookmarkButton from '../../components/ui/BookmarkButton';
import { useConnections } from '../../context/ConnectionsContext';
import {
  exploreApi,
  mapExploreService,
  mapExploreTalent,
} from '../../services/exploreApi';
import {
  mapApiListingToJob,
  marketplaceApi,
  type ApiEmploymentType,
} from '../../services/marketplaceApi';
import { openUserProfile } from '../../utils/openUserProfile';
import { catalogService } from '../../services/catalogService';
import {
  emptyExploreTaxonomy,
  exploreFilterParams,
  exploreTaxonomyKey,
  isInactiveTaxonomyFilterError,
  pruneExploreSelection,
  type ExploreTaxonomySelection,
} from '../../domain/exploreTaxonomy';
import { loadTaxonomy, resetTaxonomyCache } from '../../services/taxonomyApi';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

type Row =
  | { kind: 'talent'; talent: Talent }
  | { kind: 'service'; service: Service }
  | { kind: 'job'; job: Job };

type Bucket<T> = {
  items: T[];
  businesses: Talent[];
  total: number;
  error: string | null;
  initialLoading: boolean;
  pending: boolean;
  loadingMore: boolean;
  loadedKey: string | null;
};

function emptyBucket<T>(): Bucket<T> {
  return {
    items: [],
    businesses: [],
    total: 0,
    error: null,
    initialLoading: true,
    pending: false,
    loadingMore: false,
    loadedKey: null,
  };
}

function relationToConnectStatus(relation: ConnectionRelation): TalentConnectStatus {
  if (relation === 'connected') return 'added';
  if (relation === 'outgoing') return 'request-sent';
  if (relation === 'incoming') return 'incoming';
  return 'connect';
}

function postedLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function markPending<T>(
  set: React.Dispatch<React.SetStateAction<Bucket<T>>>,
  mode: 'reset' | 'more',
) {
  set((current) => ({
    ...current,
    error: null,
    pending: mode === 'reset' && current.items.length > 0,
    initialLoading: mode === 'reset' && current.items.length === 0,
    loadingMore: mode === 'more',
  }));
}

function markFailed<T>(
  set: React.Dispatch<React.SetStateAction<Bucket<T>>>,
  message: string,
  mode: 'reset' | 'more',
) {
  set((current) => ({
    ...current,
    error: message,
    items: mode === 'reset' ? [] : current.items,
    businesses: mode === 'reset' ? [] : current.businesses,
    total: mode === 'reset' ? 0 : current.total,
    initialLoading: false,
    pending: false,
    loadingMore: false,
    loadedKey: mode === 'reset' ? null : current.loadedKey,
  }));
}

function settlePending<T>(set: React.Dispatch<React.SetStateAction<Bucket<T>>>) {
  set((current) => ({
    ...current,
    pending: false,
    loadingMore: false,
    initialLoading: current.items.length === 0 && !current.loadedKey ? current.initialLoading : false,
  }));
}

function appendUnique<T extends { id: string }>(current: T[], next: T[]): T[] {
  const seen = new Set(current.map((item) => item.id));
  return [...current, ...next.filter((item) => !seen.has(item.id))];
}

export default function SearchScreen({ navigation, route }: TabScreenProps<'SearchTab'>) {
  const insets = useSafeAreaInsets();
  const listBottomInset = listPaddingAboveTabBar(insets.bottom, spacing.md);
  const { user: me } = useMyProfile();
  const {
    getRelation,
    requestConnect,
    cancelOutgoing,
    disconnect,
    acceptRequest,
    mutationBusy,
  } = useConnections();
  const [disconnectTarget, setDisconnectTarget] = useState<{
    userId: string;
    name: string;
  } | null>(null);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [tab, setTab] = useState<ExploreTab>(normalizeExploreTab(route.params?.contentType));
  const [filters, setFilters] = useState<ExploreSheetValue>({
    locationCode: null,
    talentSort: 'recommended',
    employmentType: null,
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [taxonomyByTab, setTaxonomyByTab] = useState<
    Record<ExploreTab, ExploreTaxonomySelection>
  >({
    talents: emptyExploreTaxonomy(),
    services: emptyExploreTaxonomy(),
    jobs: emptyExploreTaxonomy(),
  });
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [talents, setTalents] = useState<Bucket<Talent>>(emptyBucket);
  const [services, setServices] = useState<Bucket<Service>>(emptyBucket);
  const [jobs, setJobs] = useState<Bucket<Job>>(emptyBucket);
  const requestGen = useRef({ talents: 0, services: 0, jobs: 0 });
  const satisfiedKey = useRef({ talents: '', services: '', jobs: '' });
  const resetHold = useRef({ talents: false, services: false, jobs: false });

  useEffect(() => {
    if (route.params?.contentType) {
      setTab(normalizeExploreTab(route.params.contentType));
    }
  }, [route.params?.contentType]);

  const talentKey = `${query.trim()}|${filters.locationCode ?? ''}|${filters.talentSort}|${exploreTaxonomyKey(taxonomyByTab.talents)}`;
  const serviceKey = `${query.trim()}|${filters.locationCode ?? ''}|${exploreTaxonomyKey(taxonomyByTab.services)}`;
  const jobKey = `${query.trim()}|${filters.employmentType ?? ''}|${exploreTaxonomyKey(taxonomyByTab.jobs)}`;
  const activeKey = tab === 'talents' ? talentKey : tab === 'services' ? serviceKey : jobKey;

  const recoverInactiveFilters = useCallback(async (target: ExploreTab) => {
    resetTaxonomyCache();
    setCatalogAttempt((current) => current + 1);
    try {
      const catalog = await loadTaxonomy();
      setTaxonomyByTab((current) => {
        const next = pruneExploreSelection(current[target], catalog.categories);
        if (exploreTaxonomyKey(next) === exploreTaxonomyKey(current[target])) return current;
        return { ...current, [target]: next };
      });
    } catch {
      // The chip row keeps Clear available when the catalog cannot refresh.
    }
  }, []);

  const load = useCallback(
    async (target: ExploreTab, mode: 'reset' | 'more', gen: number) => {
      const q = query.trim();
      if (target === 'talents') markPending(setTalents, mode);
      else if (target === 'services') markPending(setServices, mode);
      else markPending(setJobs, mode);
      try {
        if (target === 'talents') {
          const skip = mode === 'more' ? talents.items.length : 0;
          const facets = exploreFilterParams(taxonomyByTab.talents);
          const page = await exploreApi.listTalents({
            q: q || undefined,
            locationCode: filters.locationCode ?? undefined,
            sort: filters.talentSort,
            categoryIds: facets.categoryIds,
            skip,
            take: PAGE_SIZE,
          });
          if (requestGen.current.talents !== gen) return false;
          const next = page.items.map(mapExploreTalent);
          const studios = (page.businesses ?? []).map(mapExploreTalent);
          setTalents((current) => ({
            ...current,
            items: mode === 'more' ? appendUnique(current.items, next) : next,
            businesses: mode === 'more' ? current.businesses : studios,
            total: page.total,
            error: null,
            initialLoading: false,
            pending: false,
            loadingMore: false,
            loadedKey: talentKey,
          }));
          return true;
        }
        if (target === 'services') {
          const skip = mode === 'more' ? services.items.length : 0;
          const facets = exploreFilterParams(taxonomyByTab.services);
          const page = await exploreApi.listServices({
            q: q || undefined,
            locationCode: filters.locationCode ?? undefined,
            sort: 'newest',
            categoryIds: facets.categoryIds,
            skip,
            take: PAGE_SIZE,
          });
          if (requestGen.current.services !== gen) return false;
          const next = page.items.map(mapExploreService);
          setServices((current) => ({
            ...current,
            items: mode === 'more' ? appendUnique(current.items, next) : next,
            total: page.total,
            error: null,
            initialLoading: false,
            pending: false,
            loadingMore: false,
            loadedKey: serviceKey,
          }));
          return true;
        }
        const skip = mode === 'more' ? jobs.items.length : 0;
        const facets = exploreFilterParams(taxonomyByTab.jobs);
        const page = await marketplaceApi.listOpenListings({
          q: q || undefined,
          employmentType: filters.employmentType ?? undefined,
          categoryIds: facets.categoryIds,
          skip,
          take: PAGE_SIZE,
        });
        if (requestGen.current.jobs !== gen) return false;
        const next = page.items.map(mapApiListingToJob);
        setJobs((current) => ({
          ...current,
          items: mode === 'more' ? appendUnique(current.items, next) : next,
          total: page.total,
          error: null,
          initialLoading: false,
          pending: false,
          loadingMore: false,
            loadedKey: jobKey,
          }));
        return true;
      } catch (error) {
        if (requestGen.current[target] !== gen) return false;
        const message = error instanceof Error ? error.message : 'Failed to load explore';
        if (mode === 'reset') satisfiedKey.current[target] = '';
        if (target === 'talents') markFailed(setTalents, message, mode);
        else if (target === 'services') markFailed(setServices, message, mode);
        else markFailed(setJobs, message, mode);
        if (isInactiveTaxonomyFilterError(message)) {
          void recoverInactiveFilters(target);
        }
        return false;
      }
    },
    [
      filters.employmentType,
      filters.locationCode,
      filters.talentSort,
      jobKey,
      jobs.items.length,
      query,
      serviceKey,
      services.items.length,
      talentKey,
      talents.items.length,
      recoverInactiveFilters,
      taxonomyByTab,
    ],
  );

  const loadRef = useRef(load);
  loadRef.current = load;
  const paging = useRef(false);

  useEffect(() => {
    if (satisfiedKey.current[tab] === activeKey) {
      requestGen.current[tab] += 1;
      resetHold.current[tab] = false;
      if (tab === 'talents') settlePending(setTalents);
      else if (tab === 'services') settlePending(setServices);
      else settlePending(setJobs);
      return;
    }
    const gen = ++requestGen.current[tab];
    resetHold.current[tab] = true;
    if (tab === 'talents') markPending(setTalents, 'reset');
    else if (tab === 'services') markPending(setServices, 'reset');
    else markPending(setJobs, 'reset');
    const delay = query.trim() ? SEARCH_DEBOUNCE_MS : 0;
    const timer = setTimeout(() => {
      void loadRef.current(tab, 'reset', gen).then((ok) => {
        if (requestGen.current[tab] !== gen) return;
        resetHold.current[tab] = false;
        if (ok) satisfiedKey.current[tab] = activeKey;
      });
    }, delay);
    return () => clearTimeout(timer);
  }, [activeKey, query, tab]);

  const bucket = tab === 'talents' ? talents : tab === 'services' ? services : jobs;
  const rows: Row[] =
    tab === 'talents'
      ? [
          ...talents.businesses.map((talent) => ({ kind: 'talent' as const, talent })),
          ...talents.items.map((talent) => ({ kind: 'talent' as const, talent })),
        ]
      : tab === 'services'
        ? services.items.map((service) => ({ kind: 'service' as const, service }))
        : jobs.items.map((job) => ({ kind: 'job' as const, job }));

  const hasMore = bucket.items.length < bucket.total;

  const handleConnect = (userId: string, displayName: string) => {
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
    setDisconnectTarget({ userId, name: displayName });
  };

  const retry = () => {
    if (isInactiveTaxonomyFilterError(bucket.error || '')) {
      void recoverInactiveFilters(tab);
      return;
    }
    satisfiedKey.current[tab] = '';
    const gen = ++requestGen.current[tab];
    resetHold.current[tab] = true;
    void load(tab, 'reset', gen).then((ok) => {
      if (requestGen.current[tab] !== gen) return;
      resetHold.current[tab] = false;
      if (ok) satisfiedKey.current[tab] = activeKey;
    });
  };

  const emptyTitle =
    tab === 'talents' ? 'No talents found' : tab === 'services' ? 'No services found' : 'No jobs found';
  const taxonomyActive = taxonomyByTab[tab].categoryIds.length > 0;

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
              maxLength={120}
              autoFocus
            />
            {query.length > 0 ? (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
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
              style={styles.mainTab}
              onPress={() => setTab(item.id)}
              activeOpacity={0.85}
            >
              <View style={[styles.mainTabLabel, selected && styles.mainTabLabelActive]}>
                <Text style={[styles.mainTabText, selected && styles.mainTabTextActive]}>
                  {item.label}
                </Text>
              </View>
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
        <Text style={styles.filterSummary} numberOfLines={1}>
          {tab === 'jobs'
            ? filters.employmentType
              ? filters.employmentType.replace('_', ' ')
              : 'All job types'
            : locationLabel(filters.locationCode)}
          {tab === 'talents'
            ? filters.talentSort === 'top-rated'
              ? ' · Top rated'
              : ' · Recommended'
            : ' · Newest'}
        </Text>
        {bucket.pending ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </View>

      <ExploreTaxonomyFilters
        tab={tab}
        value={taxonomyByTab[tab]}
        catalogAttempt={catalogAttempt}
        onChange={(update) =>
          setTaxonomyByTab((current) => ({
            ...current,
            [tab]: typeof update === 'function' ? update(current[tab]) : update,
          }))
        }
      />

      {bucket.error && bucket.items.length === 0 && !bucket.initialLoading ? (
        <View style={styles.empty}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.emptyTitle}>Could not load {tab}</Text>
          <Text style={styles.emptyText}>{bucket.error}</Text>
          <TouchableOpacity onPress={retry}>
            <Text style={styles.retry}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bucket.initialLoading ? [] : rows}
          keyExtractor={(row) =>
            row.kind === 'talent'
              ? row.talent.id
              : row.kind === 'service'
                ? `service-${row.service.id}`
                : `job-${row.job.id}`
          }
          contentContainerStyle={[styles.content, { paddingBottom: listBottomInset }]}
          keyboardShouldPersistTaps="handled"
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (
              paging.current ||
              resetHold.current[tab] ||
              !hasMore ||
              bucket.loadingMore ||
              bucket.pending ||
              bucket.initialLoading
            ) {
              return;
            }
            paging.current = true;
            const gen = requestGen.current[tab];
            void load(tab, 'more', gen).finally(() => {
              paging.current = false;
            });
          }}
          ListEmptyComponent={
            bucket.initialLoading ? (
              <View style={styles.empty}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <View style={styles.empty}>
                <Ionicons name="compass-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyTitle}>{emptyTitle}</Text>
                <Text style={styles.emptyText}>
                  {taxonomyActive
                    ? 'No matches for these filters.'
                    : 'Try another search or city.'}
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            bucket.loadingMore ? (
              <ActivityIndicator style={styles.footer} color={colors.primary} />
            ) : bucket.error && bucket.items.length > 0 ? (
              <TouchableOpacity onPress={retry} style={styles.footer}>
                <Text style={styles.retry}>{bucket.error} · Retry</Text>
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item }) => {
            if (item.kind === 'talent') {
              return (
                <TalentCard
                  talent={item.talent}
                  connectStatus={relationToConnectStatus(getRelation(item.talent.user.id))}
                  onPress={() => openUserProfile(navigation, item.talent.user.id, me.id)}
                  onConnect={() =>
                    handleConnect(item.talent.user.id, item.talent.user.name)
                  }
                />
              );
            }
            if (item.kind === 'service') {
              return (
                <ServiceCard
                  service={item.service}
                  onPress={() => {
                    catalogService.rememberService(item.service);
                    navigation.navigate(
                      'ServiceDetail',
                      serviceDetailRoute(
                        item.service.id,
                        item.service.provider.id,
                        me.id,
                      ),
                    );
                  }}
                  onProviderPress={() =>
                    openUserProfile(navigation, item.service.provider.id, me.id)
                  }
                />
              );
            }
            return (
              <JobCard
                job={item.job}
                onPress={() =>
                  navigation.navigate('JobListingDetail', { listingId: item.job.id })
                }
              />
            );
          }}
        />
      )}

      <ConfirmActionModal
        visible={disconnectTarget != null}
        title="Disconnect connection?"
        message={
          disconnectTarget
            ? `Are you sure you want to disconnect from ${disconnectTarget.name}?`
            : ''
        }
        confirmLabel="Disconnect"
        cancelLabel="Cancel"
        danger
        busy={mutationBusy}
        onCancel={() => setDisconnectTarget(null)}
        onConfirm={() => {
          if (!disconnectTarget) return;
          const userId = disconnectTarget.userId;
          setDisconnectTarget(null);
          disconnect(userId);
        }}
      />

      <ExploreFilterSheet
        visible={filterOpen}
        tab={tab}
        value={filters}
        onClose={() => setFilterOpen(false)}
        onApply={(next) => {
          setFilters(next);
          setFilterOpen(false);
        }}
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
      : connectStatus === 'incoming'
        ? styles.connectIncoming
        : connectStatus === 'request-sent'
          ? styles.connectPending
          : styles.connectDefault;
  const connectIcon: keyof typeof Ionicons.glyphMap =
    connectStatus === 'added'
      ? 'checkmark'
      : connectStatus === 'incoming'
        ? 'arrow-down'
        : connectStatus === 'request-sent'
          ? 'time-outline'
          : 'person-add-outline';
  const studio = talent.user.accountType === 'business';

  return (
    <TouchableOpacity style={styles.talentCard} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.talentRow}>
        <UserAvatar uri={talent.user.avatar} size={36} style={styles.talentAvatar} />
        <View style={styles.talentBody}>
          <View style={styles.nameRow}>
            <Text style={styles.talentName}>{talent.user.name}</Text>
            {talent.user.isVerified ? (
              <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            ) : null}
            {studio ? (
              <View style={styles.studioBadge}>
                <Text style={styles.studioText}>Studio</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.talentTitle}>{displayProfileTitle(talent.user.title)}</Text>
          {talent.user.location ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={14} color={colors.text} />
              <Text style={styles.metaText}>{talent.user.location}</Text>
            </View>
          ) : null}
          {talent.skills.length > 0 ? (
            <Text style={styles.skillLine} numberOfLines={1}>
              {talent.skills.slice(0, 3).join(' · ')}
            </Text>
          ) : null}
          {(talent.reviewCount ?? 0) > 0 ? (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={colors.warning} />
              <Text style={styles.ratingValue}>{talent.rating.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({talent.reviewCount ?? 0})</Text>
            </View>
          ) : null}
        </View>
        <TouchableOpacity
          style={[styles.connectBtn, connectStyle]}
          onPress={onConnect}
          accessibilityLabel={
            connectStatus === 'incoming'
              ? 'Accept connection request'
              : connectStatus === 'request-sent'
                ? 'Cancel connection request'
                : connectStatus === 'added'
                  ? 'Confirm disconnect'
                  : 'Connect'
          }
          activeOpacity={0.85}
        >
          <Ionicons
            name={connectIcon}
            size={16}
            color={connectStatus === 'request-sent' ? colors.text : colors.white}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export function ServiceCard({
  service,
  onPress,
  onProviderPress,
  onBookmark,
}: {
  service: Service;
  onPress: () => void;
  onProviderPress: () => void;
  onBookmark?: () => void;
}) {
  const saved = useSaved();
  const shown = saved.isSaved('service', service.id, Boolean(service.isSaved));
  const providerReviews = service.provider.reviewCount ?? 0;
  return (
    <TouchableOpacity style={styles.serviceCard} onPress={onPress} activeOpacity={0.9}>
      <ServiceMediaMosaic images={service.images} />
      <View style={styles.serviceBody}>
        <View style={styles.serviceTitleRow}>
          <Text style={styles.serviceTitle} numberOfLines={1}>
            {service.title}
          </Text>
          <BookmarkButton
            kind="service"
            saved={shown}
            onPress={() => {
              if (onBookmark) onBookmark();
              else void saved.setDesired('service', service.id, !shown, Boolean(service.isSaved));
            }}
          />
        </View>
        {service.category ? <Text style={styles.categoryText}>{service.category}</Text> : null}
        <Text style={styles.serviceDesc} numberOfLines={2}>
          {service.description}
        </Text>
        <TouchableOpacity style={styles.providerRow} onPress={onProviderPress} activeOpacity={0.85}>
          <UserAvatar uri={service.provider.avatar} size={20} style={styles.providerAvatar} />
          <Text style={styles.providerName}>{service.provider.name}</Text>
          {service.provider.isVerified ? (
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
          ) : null}
        </TouchableOpacity>
        {service.provider.location ? (
          <Text style={styles.serviceMeta}>{service.provider.location}</Text>
        ) : null}
        {providerReviews > 0 ? (
          <Text style={styles.providerRating}>
            Provider · {(service.provider.rating ?? 0).toFixed(1)} ({providerReviews})
          </Text>
        ) : null}
        {service.duration ? <Text style={styles.serviceMeta}>{service.duration}</Text> : null}
        {service.price != null ? (
          <MoneyAmount
            amount={service.price}
            currency={service.currency}
            size={14}
            color={colors.textTertiary}
          />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export function JobCard({
  job,
  onPress,
  onBookmark,
}: {
  job: Job;
  onPress: () => void;
  onBookmark?: () => void;
}) {
  const saved = useSaved();
  const shown = saved.isSaved('job', job.id, Boolean(job.isSaved));
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
        <View style={styles.nameRow}>
          <Text style={styles.jobCompany}>{job.company}</Text>
          {job.companyVerified ? (
            <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
          ) : null}
        </View>
        <Text style={styles.jobMeta}>{job.location}</Text>
        <MoneyAmount
          amount={stripCurrencyCodeTokens(job.salary) || 'Negotiable'}
          currency={job.currency}
          size={14}
          color={colors.textTertiary}
          rawLabel
        />
        {job.postedAt ? <Text style={styles.jobMeta}>Posted {postedLabel(job.postedAt)}</Text> : null}
      </View>
      <View style={styles.jobAside}>
        <BookmarkButton
          kind="job"
          saved={shown}
          onPress={() => {
            if (onBookmark) onBookmark();
            else void saved.setDesired('job', job.id, !shown, Boolean(job.isSaved));
          }}
        />
        <View style={[styles.jobBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
          <Text style={[styles.jobBadgeText, { color: badge.text }]}>{badge.label}</Text>
        </View>
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
  pageTitle: { fontSize: 20, lineHeight: 28, fontWeight: '600', color: colors.text },
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
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    minHeight: 40,
  },
  searchField: { flex: 1, ...typography.body, color: colors.text, paddingVertical: spacing.sm },
  cancelText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  mainTabs: { flexDirection: 'row', paddingHorizontal: spacing.screen },
  mainTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  mainTabLabel: {
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  mainTabLabelActive: { borderBottomColor: colors.primary },
  mainTabText: { ...typography.body, color: colors.textSecondary },
  mainTabTextActive: { color: colors.text, fontWeight: '600' },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.sm,
  },
  filterIconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  filterSummary: { flex: 1, ...typography.bodySmall, color: colors.textSecondary },
  content: { paddingHorizontal: spacing.screen, flexGrow: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyTitle: { ...typography.h3, color: colors.text },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center' },
  retry: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  footer: { paddingVertical: spacing.md },
  talentCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  talentRow: { flexDirection: 'row', gap: spacing.sm },
  talentAvatar: {},
  talentBody: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  talentName: { ...typography.body, color: colors.text, fontWeight: '600' },
  studioBadge: {
    backgroundColor: '#FDF2F8',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  studioText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  talentTitle: { ...typography.bodySmall, color: colors.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...typography.caption, color: colors.text },
  skillLine: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingValue: { ...typography.caption, color: colors.text },
  ratingCount: { ...typography.caption, color: '#829AB1' },
  connectBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectDefault: { backgroundColor: colors.primary },
  connectPending: { backgroundColor: colors.borderLight },
  connectIncoming: { backgroundColor: colors.warning },
  connectAdded: { backgroundColor: colors.success },
  serviceCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  serviceBody: { padding: spacing.md, gap: 4 },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  serviceTitle: { ...typography.body, color: colors.text, fontWeight: '600', flex: 1 },
  categoryText: { ...typography.caption, color: colors.primary },
  serviceDesc: { ...typography.bodySmall, color: colors.textSecondary },
  providerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  providerAvatar: {},
  providerName: { ...typography.bodySmall, color: colors.text },
  serviceMeta: { ...typography.caption, color: colors.textTertiary },
  providerRating: { ...typography.caption, color: colors.text, fontWeight: '600' },
  jobCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  jobLogoWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.button,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  jobLogo: { width: 44, height: 44 },
  jobLogoText: { ...typography.body, fontWeight: '700', color: colors.text },
  jobBody: { flex: 1, gap: 2 },
  jobTitle: { ...typography.body, color: colors.text, fontWeight: '600' },
  jobCompany: { ...typography.bodySmall, color: colors.textSecondary },
  jobMeta: { ...typography.caption, color: colors.textTertiary },
  jobAside: { alignItems: 'flex-end', gap: spacing.sm },
  jobBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  jobBadgeText: { ...typography.caption, fontWeight: '600' },
});
