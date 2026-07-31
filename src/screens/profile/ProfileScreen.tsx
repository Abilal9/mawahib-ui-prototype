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
import ProfileTabs from '../../components/profile/ProfileTabs';
import ProfileCollapsingHeader from '../../components/profile/ProfileCollapsingHeader';
import ProfileHeaderChrome, {
  PROFILE_FIXED_BAR_BODY,
} from '../../components/profile/ProfileHeaderChrome';
import ProfileEmptyState from '../../components/profile/ProfileEmptyState';
import AboutTab from '../../components/profile/AboutTab';
import { toImageSource } from '../../utils/image';
import { shareProfile } from '../../utils/shareProfile';
import { colors, spacing, radius, typography } from '../../theme';
import { useMyProfile } from '../../context/ProfileContext';
import { posts } from '../../data/mock/posts';
import { ProfileTab, AboutSectionKey } from '../../data/mock/myProfile';
import { Post } from '../../data/types';
import { ScreenProps } from '../../navigation/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MEDIA = (SCREEN_WIDTH - spacing.screen * 2 - spacing.sm * 2) / 3;
const TABS_FALLBACK = 56;

export default function ProfileScreen({ navigation }: ScreenProps<'Profile'>) {
  const [activeTab, setActiveTab] = React.useState<ProfileTab>('About');
  const [tabsHeight, setTabsHeight] = React.useState(TABS_FALLBACK);
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { user, content, useEmptyProfile } = useMyProfile();
  const userPosts = posts.filter((p) => content.postIds.includes(p.id));

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
          connectionsLabel={`${user.followers} connections`}
        />

        <View onLayout={(e) => setTabsHeight(e.nativeEvent.layout.height)}>
          <ProfileTabs active={activeTab} onChange={setActiveTab} />
        </View>

        {/* Tall enough that short tabs can still scroll until sticky tabs pin */}
        <View style={{ minHeight: tabContentMinHeight }}>
          {activeTab === 'About' && (
            <>
              <AboutTab content={content} isOwn onAdd={openAbout} onEdit={openAbout} />
              {content.bio ? (
                <TouchableOpacity style={styles.demoEmpty} onPress={useEmptyProfile}>
                  <Text style={styles.demoEmptyText}>Preview empty profile</Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}

          {activeTab === 'Portfolio' &&
            (content.portfolio.length === 0 ? (
              <ProfileEmptyState
                icon="briefcase-outline"
                title="Your Portfolio is Empty"
                description="Publishing projects makes you 5x more discoverable by recruiters."
                cta="Add Project"
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
                      onPress={() => navigation.navigate('AddPortfolioProject')}
                    >
                      <Ionicons name="add" size={22} color={colors.primary} />
                    </TouchableOpacity>
                    <Ionicons name="download-outline" size={20} color={colors.textSecondary} />
                    <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
                  </View>
                </View>
                {content.portfolio.map((project) => (
                  <View key={project.id} style={styles.projectCard}>
                    <Text style={styles.projectTitle}>{project.title}</Text>
                    <Text style={styles.projectDesc}>{project.description}</Text>
                    <View style={styles.mediaGrid}>
                      {project.images.map((uri, index) => (
                        <View key={`${project.id}-${index}`} style={styles.mediaItem}>
                          <Image
                            source={{ uri }}
                            style={styles.mediaImage}
                            contentFit="cover"
                          />
                          {project.hasVideo &&
                          index === (project.videoIndex ?? project.images.length - 1) ? (
                            <View style={styles.playOverlay}>
                              <Ionicons name="play" size={18} color={colors.white} />
                            </View>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ))}

          {activeTab === 'Services' &&
            (content.services.length === 0 ? (
              <ProfileEmptyState
                icon="document-text-outline"
                title="Your Services Are Empty"
                description="Add services to start receiving requests."
                cta="Add Service"
                onPress={() => navigation.navigate('AddProfileService')}
                showHeaderAdd
                headerTitle="Services"
              />
            ) : (
              <View style={styles.tabPad}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Services</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('AddProfileService')}>
                    <Ionicons name="add" size={22} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                {content.services.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={styles.serviceCard}
                    activeOpacity={0.9}
                    onPress={() =>
                      navigation.navigate('ServiceDetail', { serviceId: service.id })
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
                          onPress={() => navigation.navigate('Reviews', { userId: user.id })}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="star" size={14} color="#F5A623" />
                          <Text style={styles.ratingInlineText}>
                            {service.rating.toFixed(1)}
                          </Text>
                          <Text style={styles.reviewCount}>({service.reviewCount})</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.serviceDesc} numberOfLines={2}>
                        {service.description}
                      </Text>
                      {service.packages.map((pkg) => (
                        <View key={pkg.name} style={styles.priceRow}>
                          <Text style={styles.priceLabel}>{pkg.name}</Text>
                          <Text style={styles.priceValue}>
                            <Text style={styles.currency}>﷼ </Text>
                            {pkg.priceLabel}
                          </Text>
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
                title="No Posts Yet"
                description="Share updates to stay active."
                cta="Add Post"
                onPress={() => navigation.navigate('PostCreate')}
                showHeaderAdd
                headerTitle="Posts"
              />
            ) : (
              <View style={styles.tabPad}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Posts</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('PostCreate')}>
                    <Ionicons name="add" size={22} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                {userPosts.map((post) => (
                  <FeedPost
                    key={post.id}
                    post={post}
                    onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
                    onAuthorPress={() =>
                      navigation.navigate('UserProfile', { userId: post.author.id })
                    }
                  />
                ))}
              </View>
            ))}
        </View>
      </Animated.ScrollView>
    </ScreenContainer>
  );
}

function FeedPost({
  post,
  onPress,
  onAuthorPress,
}: {
  post: Post;
  onPress: () => void;
  onAuthorPress: () => void;
}) {
  const truncated =
    post.caption.length > 110 ? `${post.caption.slice(0, 110)}...` : post.caption;

  return (
    <TouchableOpacity style={styles.feedCard} onPress={onPress} activeOpacity={0.95}>
      <TouchableOpacity
        style={styles.feedHeader}
        onPress={onAuthorPress}
        activeOpacity={0.85}
      >
        <Image
          source={toImageSource(post.author.avatar)}
          style={styles.feedAvatar}
          contentFit="cover"
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.feedName}>{post.author.name}</Text>
          <Text style={styles.feedMeta}>
            {post.role ?? post.author.title ?? 'Creator'} · {post.timeAgo ?? '2h'}
          </Text>
        </View>
      </TouchableOpacity>
      <Text style={styles.feedCaption}>
        {truncated}
        {post.caption.length > 110 ? (
          <Text style={styles.seeMore}> See more</Text>
        ) : null}
      </Text>
      {post.images[0] ? (
        <Image source={{ uri: post.images[0] }} style={styles.feedImage} contentFit="cover" />
      ) : null}
      <View style={styles.feedActions}>
        <View style={styles.feedAction}>
          <Ionicons name="thumbs-up-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.feedCount}>{post.likes}</Text>
        </View>
        <View style={styles.feedAction}>
          <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.feedCount}>{post.comments}</Text>
        </View>
        <Ionicons name="arrow-redo-outline" size={18} color={colors.textSecondary} />
        <View style={{ flex: 1 }} />
        <Ionicons name="bookmark-outline" size={18} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
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
  demoEmpty: {
    marginHorizontal: spacing.screen,
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  demoEmptyText: {
    ...typography.caption,
    color: colors.textSecondary,
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
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
  priceValue: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  currency: { color: colors.primary },
  feedCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    gap: spacing.md,
  },
  feedHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  feedAvatar: { width: 40, height: 40, borderRadius: 20 },
  feedName: { ...typography.label, color: colors.text },
  feedMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  feedCaption: { ...typography.bodySmall, color: colors.text, lineHeight: 20 },
  seeMore: { color: colors.primary },
  feedImage: {
    width: '100%',
    height: 200,
    borderRadius: radius.card,
  },
  feedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  feedAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  feedCount: { ...typography.caption, color: colors.textSecondary },
});
