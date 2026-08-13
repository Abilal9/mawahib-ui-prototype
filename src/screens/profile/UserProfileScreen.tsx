import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Modal,
  Pressable,
  Alert,
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
import AboutTab from '../../components/profile/AboutTab';
import ProfileFeedPost from '../../components/profile/ProfileFeedPost';
import { shareProfile } from '../../utils/shareProfile';
import { openUserProfile } from '../../utils/openUserProfile';
import { colors, spacing, radius, typography } from '../../theme';
import { ProfileTab } from '../../data/types';
import { useConnections } from '../../context/ConnectionsContext';
import { useMyProfile } from '../../context/ProfileContext';
import { usePosts } from '../../context/PostsContext';
import { useVisitorProfessionalProfile } from '../../hooks/useVisitorProfessionalProfile';
import { useVisitorUser } from '../../hooks/useVisitorUser';
import { connectionService } from '../../services';
import { ScreenProps } from '../../navigation/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MEDIA = (SCREEN_WIDTH - spacing.screen * 2 - spacing.sm * 2) / 3;
const TABS_FALLBACK = 56;

export default function UserProfileScreen({ route, navigation }: ScreenProps<'UserProfile'>) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('About');
  const [unconnectOpen, setUnconnectOpen] = useState(false);
  const [tabsHeight, setTabsHeight] = useState(TABS_FALLBACK);
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const {
    getRelation,
    requestConnect,
    cancelOutgoing,
    acceptRequest,
    denyRequest,
    disconnect,
    getConversationId,
  } = useConnections();
  const { user: me } = useMyProfile();
  const { posts } = usePosts();
  const visitorProfessional = useVisitorProfessionalProfile(route.params.userId);
  const visitorUser = useVisitorUser(route.params.userId);
  const user = visitorUser.user;

  const fixedBarHeight = insets.top + PROFILE_FIXED_BAR_BODY;
  const scrollViewport = SCREEN_HEIGHT - fixedBarHeight;
  const tabContentMinHeight = Math.max(scrollViewport - tabsHeight, 240);

  useEffect(() => {
    if (user?.id && user.id === me.id) {
      navigation.replace('Profile');
    }
  }, [user?.id, me.id, navigation]);

  if (visitorUser.loading) {
    return (
      <ScreenContainer>
        <View style={styles.missingWrap}>
          <Text style={styles.missingText}>Loading profile…</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!user) {
    return (
      <ScreenContainer>
        <View style={styles.missingWrap}>
          <Text style={styles.missingText}>
            {visitorUser.error || 'User not found'}
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.missingBack}>
            <Text style={styles.missingBackText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  if (user.id === me.id) {
    return (
      <ScreenContainer>
        <Text>Opening your profile…</Text>
      </ScreenContainer>
    );
  }

  const relation = getRelation(user.id);
  const profileUser = {
    ...user,
    title: user.title || 'Creative Professional',
    rating: user.rating ?? 0,
    reviewCount: user.reviewCount ?? 0,
  };
  const userPosts = posts.filter((p) => p.author.id === user.id);
  const visitorConnectionCount = connectionService.getConnectionsForUser(user.id).length;

  const onConnectPress = () => {
    if (relation === 'none') {
      requestConnect(user.id);
      return;
    }
    if (relation === 'outgoing') {
      cancelOutgoing(user.id);
      return;
    }
    if (relation === 'connected') {
      setUnconnectOpen(true);
    }
  };

  const onMessagePress = () => {
    if (relation !== 'connected') {
      Alert.alert(
        'Connect to message',
        'You can only message people you’re connected with. Send a connection request first.'
      );
      return;
    }
    const conversationId = getConversationId(user.id);
    if (!conversationId) {
      Alert.alert(
        'No conversation yet',
        'A chat thread isn’t available for this connection in the demo. Try messaging someone from your inbox.'
      );
      return;
    }
    navigation.navigate('Chat', { conversationId });
  };

  const connectLabel =
    relation === 'connected'
      ? 'Connected'
      : relation === 'outgoing'
        ? 'Requested'
        : relation === 'incoming'
          ? 'Respond'
          : 'Connect';

  const connectIcon: keyof typeof Ionicons.glyphMap =
    relation === 'connected'
      ? 'checkmark'
      : relation === 'outgoing'
        ? 'time-outline'
        : 'person-add-outline';

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
          onConnectionsPress={() =>
            navigation.navigate('Connections', { userId: user.id })
          }
          connectionsLabel={`${visitorConnectionCount} connection${
            visitorConnectionCount === 1 ? '' : 's'
          }`}
        >
          {relation === 'incoming' ? (
            <View style={styles.ctaRow}>
              <TouchableOpacity
                style={styles.connectBtn}
                onPress={() => acceptRequest(user.id)}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark" size={18} color={colors.white} />
                <Text style={styles.connectText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.messageBtn}
                onPress={() => denyRequest(user.id)}
                activeOpacity={0.85}
              >
                <Ionicons name="close" size={18} color={colors.primary} />
                <Text style={styles.messageText}>Deny</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.ctaRow}>
              <TouchableOpacity
                style={[
                  styles.connectBtn,
                  relation === 'connected' && styles.connectBtnDone,
                  relation === 'outgoing' && styles.connectBtnPending,
                ]}
                onPress={onConnectPress}
                activeOpacity={0.85}
              >
                <Ionicons name={connectIcon} size={18} color={colors.white} />
                <Text style={styles.connectText}>{connectLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.messageBtn, relation !== 'connected' && styles.messageBtnDisabled]}
                onPress={onMessagePress}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={18}
                  color={relation === 'connected' ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.messageText,
                    relation !== 'connected' && styles.messageTextDisabled,
                  ]}
                >
                  Message
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.hireRow}>
            <TouchableOpacity
              style={styles.hireBtn}
              onPress={() =>
                navigation.navigate('DirectRequest', { userId: user.id })
              }
              activeOpacity={0.85}
            >
              <Ionicons name="briefcase-outline" size={18} color={colors.primary} />
              <Text style={styles.hireText}>Request Work</Text>
            </TouchableOpacity>
          </View>
        </ProfileCollapsingHeader>

        <View onLayout={(e) => setTabsHeight(e.nativeEvent.layout.height)}>
          <ProfileTabs active={activeTab} onChange={setActiveTab} />
        </View>

        {visitorProfessional.error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>
              {visitorProfessional.error}
            </Text>
          </View>
        ) : null}

        <View style={{ minHeight: tabContentMinHeight }}>
          {activeTab === 'About' && (
            <AboutTab
              content={{
                ...visitorUser.about,
                portfolio: visitorProfessional.portfolio,
                services: visitorProfessional.services,
              }}
              isOwn={false}
              onAdd={() => {}}
              onEdit={() => {}}
            />
          )}

          {activeTab === 'Portfolio' &&
            (visitorProfessional.loading ? (
              <View style={styles.tabPad}>
                <Text style={styles.emptyCopy}>Loading portfolio…</Text>
              </View>
            ) : visitorProfessional.portfolio.length === 0 ? (
              <View style={styles.tabPad}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Portfolio</Text>
                </View>
                <Text style={styles.emptyCopy}>No portfolio projects yet.</Text>
              </View>
            ) : (
              <View style={styles.tabPad}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Portfolio</Text>
                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    onPress={() =>
                      shareProfile({ userId: user.id, userName: user.name })
                    }
                    hitSlop={8}
                  >
                    <Ionicons name="share-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                {visitorProfessional.portfolio.map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    style={styles.projectCard}
                    activeOpacity={0.9}
                    onPress={() =>
                      navigation.navigate('PortfolioProjectDetail', {
                        projectId: project.id,
                        userId: user.id,
                      })
                    }
                  >
                    <Text style={styles.projectTitle}>{project.title}</Text>
                    <Text style={styles.projectDesc} numberOfLines={2}>
                      {project.description}
                    </Text>
                    <View style={styles.mediaGrid}>
                      {project.images.slice(0, 3).map((uri, index) => {
                        const videoIdx =
                          project.videoIndex ?? project.images.length - 1;
                        return (
                          <View
                            key={`${project.id}-${index}`}
                            style={styles.mediaImageWrap}
                          >
                            <Image
                              source={{ uri }}
                              style={styles.mediaImage}
                              contentFit="cover"
                            />
                            {project.hasVideo && index === videoIdx ? (
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
            (visitorProfessional.loading ? (
              <View style={styles.tabPad}>
                <Text style={styles.emptyCopy}>Loading services…</Text>
              </View>
            ) : visitorProfessional.services.length === 0 ? (
              <View style={styles.tabPad}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Services</Text>
                </View>
                <Text style={styles.emptyCopy}>No services listed yet.</Text>
              </View>
            ) : (
              <View style={styles.tabPad}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Services</Text>
                </View>
                {visitorProfessional.services.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={styles.serviceCard}
                    activeOpacity={0.9}
                    onPress={() =>
                      navigation.navigate('ServiceDetail', {
                        serviceId: service.id,
                        userId: user.id,
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

          {activeTab === 'Posts' && (
            <View style={styles.tabPad}>
              {userPosts.length === 0 ? (
                <Text style={styles.emptyCopy}>No posts yet.</Text>
              ) : (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Posts</Text>
                  </View>
                  {userPosts.slice(0, 2).map((post) => (
                    <ProfileFeedPost
                      key={post.id}
                      post={post}
                      onPress={() =>
                        navigation.navigate('PostDetail', { postId: post.id })
                      }
                      onAuthorPress={() =>
                        openUserProfile(navigation, post.author.id, me.id)
                      }
                    />
                  ))}
                  {userPosts.length > 2 ? (
                    <TouchableOpacity
                      style={styles.viewMoreBtn}
                      onPress={() =>
                        navigation.navigate('UserPosts', { userId: user.id })
                      }
                      activeOpacity={0.85}
                    >
                      <Text style={styles.viewMoreText}>View more</Text>
                      <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                    </TouchableOpacity>
                  ) : null}
                </>
              )}
            </View>
          )}
        </View>
      </Animated.ScrollView>

      <Modal
        visible={unconnectOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setUnconnectOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setUnconnectOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Unconnect?</Text>
            <Text style={styles.modalBody}>
              Are you sure you want to unconnect? You’ll have to send a request again before
              connecting with this user.
            </Text>
            <TouchableOpacity
              style={styles.modalDangerBtn}
              onPress={() => {
                disconnect(user.id);
                setUnconnectOpen(false);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalDangerText}>Unconnect</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setUnconnectOpen(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
  connectBtnPending: {
    backgroundColor: '#627D98',
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
  messageBtnDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  messageText: { ...typography.button, color: colors.primary },
  messageTextDisabled: { color: colors.textSecondary },
  hireRow: {
    paddingHorizontal: spacing.screen,
    marginBottom: spacing.xs,
  },
  hireBtn: {
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
  hireText: { ...typography.button, color: colors.primary },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: spacing.screen,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.xl,
  },
  modalTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  modalBody: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  modalDangerBtn: {
    backgroundColor: colors.error,
    borderRadius: radius.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalDangerText: { ...typography.button, color: colors.white },
  modalCancelBtn: {
    borderRadius: radius.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: { ...typography.button, color: colors.text },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { ...typography.h3, color: colors.text },
  actionIconBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPad: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  projectCard: { gap: spacing.sm },
  projectTitle: { ...typography.bodyMedium, color: colors.text, fontWeight: '600' },
  projectDesc: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  mediaImageWrap: {
    width: MEDIA,
    height: MEDIA,
    borderRadius: radius.button,
    overflow: 'hidden',
    backgroundColor: colors.borderLight,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
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
  serviceTitle: {
    flex: 1,
    ...typography.bodyMedium,
    fontWeight: '500',
    color: colors.text,
  },
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
  emptyCopy: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xxl,
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
  missingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  missingText: { ...typography.body, color: colors.text, textAlign: 'center' },
  missingBack: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
  },
  missingBackText: { ...typography.button, color: colors.white },
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
