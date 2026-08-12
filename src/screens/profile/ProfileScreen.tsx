import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenContainer from '../../components/ui/ScreenContainer';
import CurrencyIcon from '../../components/ui/CurrencyIcon';
import { stripCurrencyGlyphs } from '../../utils/currency';
import ProfileTabs from '../../components/profile/ProfileTabs';
import ProfileCollapsingHeader from '../../components/profile/ProfileCollapsingHeader';
import ProfileHeaderChrome, {
  PROFILE_FIXED_BAR_BODY,
} from '../../components/profile/ProfileHeaderChrome';
import ProfileEmptyState from '../../components/profile/ProfileEmptyState';
import ProfileFeedPost from '../../components/profile/ProfileFeedPost';
import AboutTab from '../../components/profile/AboutTab';
import { shareProfile } from '../../utils/shareProfile';
import { openUserProfile } from '../../utils/openUserProfile';
import { colors, spacing, radius, typography } from '../../theme';
import { useMyProfile } from '../../context/ProfileContext';
import { useConnections } from '../../context/ConnectionsContext';
import { usePosts } from '../../context/PostsContext';
import { useAuth } from '../../context/AuthContext';
import {
  ProfileTab,
  AboutSectionKey,
  ABOUT_SECTION_KEYS,
  isAboutSectionFilled,
} from '../../data/types';
import { ScreenProps } from '../../navigation/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MEDIA = (SCREEN_WIDTH - spacing.screen * 2 - spacing.sm * 2) / 3;
const TABS_FALLBACK = 56;

export default function ProfileScreen({ navigation }: ScreenProps<'Profile'>) {
  const [activeTab, setActiveTab] = React.useState<ProfileTab>('About');
  const [tabsHeight, setTabsHeight] = React.useState(TABS_FALLBACK);
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { user, content, profileError, refreshProfessionalProfile } = useMyProfile();
  const { connectedUsers } = useConnections();
  const { posts } = usePosts();
  const { accountType } = useAuth();
  const userPosts = posts.filter((p) => content.postIds.includes(p.id));
  const completeBannerSub =
    accountType === 'business'
      ? 'Add services and details so you can post jobs and request talent confidently.'
      : 'Complete your portfolio and services so clients can find you and send requests.';

  const aboutIncomplete = ABOUT_SECTION_KEYS.some(
    (key) => !isAboutSectionFilled(content, key)
  );
  const profileNeedsWork =
    aboutIncomplete ||
    content.portfolio.length === 0 ||
    content.services.length === 0 ||
    userPosts.length === 0;

  const fixedBarHeight = insets.top + PROFILE_FIXED_BAR_BODY;
  const scrollViewport = SCREEN_HEIGHT - fixedBarHeight;
  const tabContentMinHeight = Math.max(scrollViewport - tabsHeight, 240);

  const openAbout = (key: AboutSectionKey) => {
    navigation.navigate('EditAboutSection', { section: key });
  };

  return (
    <ScreenContainer padded={false} safeTop={false} backgroundColor={colors.background}>
      <StatusBar style="light" />

      <ProfileHeaderChrome
        topInset={insets.top}
        scrollY={scrollY}
        onBack={() => navigation.goBack()}
        secondaryRightIcon="create-outline"
        onSecondaryRightPress={() => navigation.navigate('EditProfile')}
        rightIcon="share-outline"
        onRightPress={() =>
          shareProfile({ userId: user.id, userName: user.name })
        }
      />

      <Animated.ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        <ProfileCollapsingHeader
          user={user}
          scrollY={scrollY}
          onReviewsPress={() => navigation.navigate('Reviews', { userId: user.id })}
          onConnectionsPress={() => navigation.navigate('Connections')}
          connectionsLabel={`${connectedUsers.length} connection${
            connectedUsers.length === 1 ? '' : 's'
          }`}
        />

        <View onLayout={(e) => setTabsHeight(e.nativeEvent.layout.height)}>
          <ProfileTabs active={activeTab} onChange={setActiveTab} />
        </View>

        {profileError ? (
          <TouchableOpacity
            style={styles.errorBanner}
            onPress={() => {
              void refreshProfessionalProfile();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.errorBannerText}>
              Couldn’t load portfolio/services. Tap to retry.
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Tall enough that short tabs can still scroll until sticky tabs pin */}
        <View style={{ minHeight: tabContentMinHeight }}>
          {activeTab === 'About' && (
            <>
              {profileNeedsWork ? (
                <TouchableOpacity
                  style={styles.completeBanner}
                  onPress={() => navigation.navigate('ProfileSetup', { step: 1 })}
                  activeOpacity={0.85}
                >
                  <View style={styles.completeBannerIcon}>
                    <Ionicons name="person-circle-outline" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.completeBannerText}>
                    <Text style={styles.completeBannerTitle}>Complete your profile</Text>
                    <Text style={styles.completeBannerSub}>{completeBannerSub}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
              <AboutTab content={content} isOwn onAdd={openAbout} onEdit={openAbout} />
            </>
          )}

          {activeTab === 'Portfolio' &&
            (content.portfolio.length === 0 ? (
              <ProfileEmptyState
                icon="briefcase-outline"
                title="Complete your portfolio"
                description="Add your first project so clients can see what you create."
                cta="Add project"
                onPress={() => navigation.navigate('AddPortfolioProject')}
                showHeaderAdd
                headerTitle="Portfolio"
              />
            ) : (
              <View style={styles.tabPad}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Portfolio</Text>
                  <View style={styles.headerActions}>
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() =>
                        navigation.navigate('ManageProfileList', { type: 'portfolio' })
                      }
                      hitSlop={8}
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={20}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => navigation.navigate('AddPortfolioProject')}
                    >
                      <Ionicons name="add-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() =>
                        shareProfile({ userId: user.id, userName: user.name })
                      }
                      hitSlop={8}
                    >
                      <Ionicons
                        name="share-outline"
                        size={20}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                {content.portfolio.map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    style={styles.projectCard}
                    activeOpacity={0.9}
                    onPress={() =>
                      navigation.navigate('PortfolioProjectDetail', {
                        projectId: project.id,
                      })
                    }
                  >
                    <Text style={styles.projectTitle}>{project.title}</Text>
                    <Text style={styles.projectDesc} numberOfLines={2}>
                      {project.description}
                    </Text>
                    <View style={styles.mediaGrid}>
                      {project.images.slice(0, 3).map((uri, imgIndex) => {
                        const videoIdx =
                          project.videoIndex ?? project.images.length - 1;
                        return (
                          <View
                            key={`${project.id}-${imgIndex}`}
                            style={styles.mediaItem}
                          >
                            <Image
                              source={{ uri }}
                              style={styles.mediaImage}
                              contentFit="cover"
                            />
                            {project.hasVideo && imgIndex === videoIdx ? (
                              <View style={styles.playOverlay}>
                                <Ionicons name="play" size={18} color={colors.white} />
                              </View>
                            ) : null}
                          </View>
                        );
                      })}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}

          {activeTab === 'Services' &&
            (content.services.length === 0 ? (
              <ProfileEmptyState
                icon="document-text-outline"
                title="Add a service"
                description="List what you offer so clients can send you requests."
                cta="Add service"
                onPress={() => navigation.navigate('AddProfileService')}
                showHeaderAdd
                headerTitle="Services"
              />
            ) : (
              <View style={styles.tabPad}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Services</Text>
                  <View style={styles.headerActions}>
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() =>
                        navigation.navigate('ManageProfileList', { type: 'services' })
                      }
                      hitSlop={8}
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={20}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => navigation.navigate('AddProfileService')}
                    >
                      <Ionicons name="add-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
                {content.services.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={styles.serviceCard}
                    activeOpacity={0.9}
                    onPress={() =>
                      navigation.navigate('ServiceDetail', {
                        serviceId: service.id,
                      })
                    }
                  >
                    <View style={styles.serviceImageWrap}>
                      <Image
                        source={{ uri: service.images[0] }}
                        style={styles.serviceImage}
                        contentFit="cover"
                      />
                      {service.images.length > 1 ? (
                        <View style={styles.dots}>
                          {service.images.slice(0, 3).map((_, i) => (
                            <View
                              key={i}
                              style={[styles.dot, i === 0 && styles.dotActive]}
                            />
                          ))}
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.serviceBody}>
                      <View style={styles.serviceTitleRow}>
                        <Text style={styles.serviceTitle}>{service.title}</Text>
                        <TouchableOpacity
                          style={styles.ratingInline}
                          onPress={() =>
                            navigation.navigate('Reviews', { userId: user.id })
                          }
                          activeOpacity={0.8}
                        >
                          <Ionicons name="star" size={14} color="#F5A623" />
                          <Text style={styles.ratingInlineText}>
                            {service.rating.toFixed(1)}
                          </Text>
                          <Text style={styles.reviewCount}>
                            ({service.reviewCount})
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.serviceDesc} numberOfLines={2}>
                        {service.description}
                      </Text>
                      {service.packages.map((pkg) => (
                        <View key={pkg.name} style={styles.priceRow}>
                          <Text style={styles.priceLabel}>{pkg.name}</Text>
                          <View style={styles.priceValueRow}>
                            <CurrencyIcon
                              size={12}
                              color={colors.primary}
                              location={user.location}
                            />
                            <Text style={styles.priceValue}>
                              {stripCurrencyGlyphs(pkg.priceLabel)}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}

          {activeTab === 'Posts' &&
            (userPosts.length === 0 ? (
              <ProfileEmptyState
                icon="grid-outline"
                title="Share your first post"
                description="Post updates to stay active and grow your audience."
                cta="Create post"
                onPress={() => navigation.navigate('PostCreate')}
                showHeaderAdd
                headerTitle="Posts"
              />
            ) : (
              <View style={styles.tabPad}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Posts</Text>
                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    onPress={() => navigation.navigate('PostCreate')}
                  >
                    <Ionicons name="add-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                {userPosts.slice(0, 2).map((post) => (
                  <ProfileFeedPost
                    key={post.id}
                    post={post}
                    onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
                    onAuthorPress={() =>
                      openUserProfile(navigation, post.author.id, user.id)
                    }
                  />
                ))}
                {userPosts.length > 2 ? (
                  <TouchableOpacity
                    style={styles.viewMoreBtn}
                    onPress={() => navigation.navigate('UserPosts')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.viewMoreText}>View more</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
        </View>
      </Animated.ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
    backgroundColor: 'transparent',
  },
  completeBanner: {
    marginHorizontal: spacing.screen,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.primary + '0F',
    borderWidth: 1,
    borderColor: colors.primary + '33',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  completeBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeBannerText: {
    flex: 1,
    gap: 2,
  },
  completeBannerTitle: {
    ...typography.label,
    color: colors.text,
  },
  completeBannerSub: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  errorBanner: {
    marginHorizontal: spacing.screen,
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.button,
    backgroundColor: colors.error + '14',
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  errorBannerText: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
  },
  tabPad: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { ...typography.h3, color: colors.text },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  actionIconBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectCard: { gap: spacing.sm },
  projectTitle: { ...typography.bodyMedium, color: colors.text, fontWeight: '600' },
  projectDesc: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  mediaItem: {
    width: MEDIA,
    height: MEDIA,
    borderRadius: radius.button,
    overflow: 'hidden',
    backgroundColor: colors.borderLight,
  },
  mediaImage: { width: '100%', height: '100%' },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  serviceImageWrap: { height: 180, backgroundColor: colors.borderLight },
  serviceImage: { width: '100%', height: '100%' },
  dots: {
    position: 'absolute',
    bottom: 12,
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
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  dotActive: {
    width: 16,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  serviceBody: { padding: spacing.md, gap: spacing.sm },
  serviceTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  serviceTitle: { flex: 1, ...typography.bodyMedium, fontWeight: '500', color: colors.text },
  ratingInline: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingInlineText: { ...typography.caption, color: colors.text },
  reviewCount: { ...typography.caption, color: '#829AB1' },
  serviceDesc: { ...typography.caption, color: colors.textTertiary, lineHeight: 18 },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  priceLabel: { ...typography.caption, color: colors.textSecondary },
  priceValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceValue: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  viewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.primary + '55',
    backgroundColor: colors.primary + '0A',
  },
  viewMoreText: {
    ...typography.button,
    color: colors.primary,
    fontSize: 15,
  },
});
