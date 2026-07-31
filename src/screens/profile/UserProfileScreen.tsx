import React, { useRef, useState } from 'react';
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
import AboutTab from '../../components/profile/AboutTab';
import { shareProfile } from '../../utils/shareProfile';
import { colors, spacing, radius, typography } from '../../theme';
import { getUserById } from '../../data/mock/users';
import { resolveProfileUser } from '../../data/mock/resolveUser';
import { posts } from '../../data/mock/posts';
import { talents } from '../../data/mock/talents';
import {
  getVisitorProfileContent,
  ProfileTab,
} from '../../data/mock/myProfile';
import { ScreenProps } from '../../navigation/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MEDIA = (SCREEN_WIDTH - spacing.screen * 2 - spacing.sm * 2) / 3;
const POST_SIZE = MEDIA;
const TABS_FALLBACK = 56;

export default function UserProfileScreen({ route, navigation }: ScreenProps<'UserProfile'>) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('About');
  const [connected, setConnected] = useState(false);
  const [tabsHeight, setTabsHeight] = useState(TABS_FALLBACK);
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const user = resolveProfileUser(route.params.userId) ?? getUserById(route.params.userId);
  const talent = talents.find((t) => t.user.id === route.params.userId);

  const fixedBarHeight = insets.top + PROFILE_FIXED_BAR_BODY;
  const scrollViewport = SCREEN_HEIGHT - fixedBarHeight;
  const tabContentMinHeight = Math.max(scrollViewport - tabsHeight, 240);

  if (!user) {
    return (
      <ScreenContainer>
        <Text>User not found</Text>
      </ScreenContainer>
    );
  }

  const content = getVisitorProfileContent(user.id);
  const profileUser = {
    ...user,
    title: user.title ?? talent?.category ?? 'Creative Professional',
    rating: talent?.rating ?? user.rating ?? 4.8,
    reviewCount: talent?.reviewCount ?? user.reviewCount ?? 24,
  };
  const userPosts = posts.filter((p) => p.author.id === user.id);

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
          user={profileUser}
          scrollY={scrollY}
          onReviewsPress={() => navigation.navigate('Reviews', { userId: user.id })}
          onConnectionsPress={() => navigation.navigate('Connections')}
          connectionsLabel={`${user.followers} connections`}
        >
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={[styles.connectBtn, connected && styles.connectBtnDone]}
              onPress={() => setConnected((v) => !v)}
              activeOpacity={0.85}
            >
              <Ionicons
                name={connected ? 'checkmark' : 'person-add-outline'}
                size={18}
                color={colors.white}
              />
              <Text style={styles.connectText}>{connected ? 'Connected' : 'Connect'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.messageBtn}
              onPress={() => navigation.navigate('Chat', { conversationId: 'c1' })}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
              <Text style={styles.messageText}>Message</Text>
            </TouchableOpacity>
          </View>
        </ProfileCollapsingHeader>

        <View onLayout={(e) => setTabsHeight(e.nativeEvent.layout.height)}>
          <ProfileTabs active={activeTab} onChange={setActiveTab} />
        </View>

        <View style={{ minHeight: tabContentMinHeight }}>
          {activeTab === 'About' && (
            <AboutTab content={content} isOwn={false} onAdd={() => {}} onEdit={() => {}} />
          )}

          {activeTab === 'Portfolio' && (
            <View style={styles.tabPad}>
              {content.portfolio.map((project) => (
                <View key={project.id} style={styles.projectCard}>
                  <Text style={styles.projectTitle}>{project.title}</Text>
                  <Text style={styles.projectDesc}>{project.description}</Text>
                  <View style={styles.mediaGrid}>
                    {project.images.map((uri, index) => (
                      <Image
                        key={`${project.id}-${index}`}
                        source={{ uri }}
                        style={styles.mediaImage}
                        contentFit="cover"
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'Services' && (
            <View style={styles.tabPad}>
              {content.services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceCard}
                  onPress={() =>
                    navigation.navigate('ServiceDetail', { serviceId: service.id })
                  }
                >
                  <Image
                    source={{ uri: service.images[0] }}
                    style={styles.serviceImage}
                    contentFit="cover"
                  />
                  <View style={styles.serviceBody}>
                    <Text style={styles.serviceTitle}>{service.title}</Text>
                    <Text style={styles.serviceDesc} numberOfLines={2}>
                      {service.description}
                    </Text>
                    <View style={styles.packageRow}>
                      {service.packages.map((pkg) => (
                        <View key={pkg.name} style={styles.packageChip}>
                          <Text style={styles.packageName}>{pkg.name}</Text>
                          <Text style={styles.packagePrice}>{pkg.priceLabel}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === 'Posts' && (
            <View style={styles.tabPad}>
              {userPosts.length === 0 ? (
                <Text style={styles.emptyCopy}>No posts yet.</Text>
              ) : (
                <View style={styles.postsGrid}>
                  {userPosts.map((post) => (
                    <TouchableOpacity
                      key={post.id}
                      style={styles.postItem}
                      onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
                    >
                      <Image
                        source={{ uri: post.images[0] }}
                        style={styles.postImage}
                        contentFit="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
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
  ctaRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screen,
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  connectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.md,
  },
  connectBtnDone: {
    backgroundColor: '#00A63E',
  },
  connectText: { ...typography.button, color: colors.white },
  messageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: spacing.md,
  },
  messageText: { ...typography.button, color: colors.primary },
  tabPad: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  projectCard: { gap: spacing.sm },
  projectTitle: { ...typography.bodyMedium, color: colors.text, fontWeight: '600' },
  projectDesc: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  mediaImage: {
    width: MEDIA,
    height: MEDIA,
    borderRadius: radius.button,
  },
  serviceCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  serviceImage: { width: '100%', height: 180 },
  serviceBody: { padding: spacing.md, gap: spacing.sm },
  serviceTitle: { ...typography.bodyMedium, fontWeight: '500', color: colors.text },
  serviceDesc: { ...typography.caption, color: colors.textTertiary },
  packageRow: { flexDirection: 'row', gap: spacing.sm },
  packageChip: {
    flex: 1,
    backgroundColor: '#FFF0F7',
    borderRadius: radius.button,
    padding: spacing.sm,
  },
  packageName: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  packagePrice: { fontSize: 11, color: colors.text, marginTop: 2 },
  emptyCopy: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  postsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  postItem: {
    width: POST_SIZE,
    height: POST_SIZE,
    borderRadius: radius.button,
    overflow: 'hidden',
  },
  postImage: { width: '100%', height: '100%' },
});
