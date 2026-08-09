import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Share,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { toImageSource } from '../../utils/image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import AppHeader from '../../components/ui/AppHeader';
import { colors, spacing, radius, typography } from '../../theme';
import { posts } from '../../data/mock/posts';
import { stories } from '../../data/mock/stories';
import { jobs } from '../../data/mock/jobs';
import { services } from '../../data/mock/services';
import { talents } from '../../data/mock/talents';
import { notifications } from '../../data/mock/notifications';
import { useSidebar } from '../../context/SidebarContext';
import { useMyProfile } from '../../context/ProfileContext';
import { openUserProfile } from '../../utils/openUserProfile';
import { TabScreenProps } from '../../navigation/types';
import { Post, Job, Story, Service, Talent } from '../../data/types';

function imageSource(src: string | number) {
  return toImageSource(src);
}

function StoryItem({
  story,
  onPress,
}: {
  story: Story;
  onPress: () => void;
}) {
  const isOwn = story.isOwn;

  return (
    <TouchableOpacity style={styles.storyItem} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.storyCard, !story.seen && !isOwn && styles.storyCardActive]}>
        <Image
          source={imageSource(story.user.avatar)}
          style={styles.storyImage}
          contentFit="cover"
        />
        {isOwn && (
          <View style={styles.storyAddButton}>
            <Ionicons name="add" size={16} color={colors.white} />
          </View>
        )}
      </View>
      <Text style={styles.storyName} numberOfLines={1}>
        {isOwn ? 'Your story' : story.user.name.split(' ')[0]}
      </Text>
    </TouchableOpacity>
  );
}

function FeedPostCard({
  post,
  onPress,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onAuthorPress,
}: {
  post: Post;
  onPress: () => void;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onBookmark: () => void;
  onAuthorPress: () => void;
}) {
  const truncated =
    post.caption.length > 120 ? `${post.caption.slice(0, 120)}...` : post.caption;

  return (
    <TouchableOpacity style={styles.feedCard} onPress={onPress} activeOpacity={0.95}>
      <TouchableOpacity
        style={styles.feedHeader}
        onPress={onAuthorPress}
        activeOpacity={0.85}
      >
        <Image
          source={imageSource(post.author.avatar)}
          style={styles.feedAvatar}
          contentFit="cover"
        />
        <View style={styles.feedAuthor}>
          <View style={styles.feedAuthorRow}>
            <Text style={styles.feedAuthorName}>{post.author.name}</Text>
            {post.author.isVerified && (
              <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
            )}
          </View>
          {post.role && <Text style={styles.feedRole}>{post.role}</Text>}
        </View>
        <Text style={styles.feedTime}>{post.timeAgo ?? '2h'}</Text>
      </TouchableOpacity>

      <Text style={styles.feedCaption}>
        {truncated}
        {post.caption.length > 120 && (
          <Text style={styles.seeMore}> See more</Text>
        )}
      </Text>

      {post.images[0] ? (
        <Image
          source={{ uri: post.images[0] }}
          style={styles.feedImage}
          contentFit="cover"
        />
      ) : null}

      <View style={styles.feedActions}>
        <TouchableOpacity
          style={styles.feedAction}
          onPress={onLike}
          hitSlop={8}
        >
          <Ionicons
            name={post.isLiked ? 'thumbs-up' : 'thumbs-up-outline'}
            size={20}
            color={post.isLiked ? colors.primary : colors.textTertiary}
          />
          <Text style={styles.feedActionCount}>{post.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.feedAction}
          onPress={onComment}
          hitSlop={8}
        >
          <Ionicons name="chatbubble-outline" size={20} color={colors.textTertiary} />
          <Text style={styles.feedActionCount}>{post.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.feedAction} onPress={onShare} hitSlop={8}>
          <Ionicons name="share-outline" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
        <View style={styles.feedActionSpacer} />
        <TouchableOpacity onPress={onBookmark} hitSlop={8}>
          <Ionicons
            name={post.isSaved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={post.isSaved ? colors.primary : colors.textTertiary}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function SectionHeader({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} hitSlop={8}>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

function JobMatchCard({
  job,
  onPress,
  onDismiss,
}: {
  job: Job;
  onPress: () => void;
  onDismiss: () => void;
}) {
  const typeLabel =
    job.type === 'part-time'
      ? 'Part-time'
      : job.type === 'full-time'
        ? 'Full-time'
        : job.type === 'contract'
          ? 'Contract'
          : job.type === 'gig'
            ? 'Gig'
            : 'Freelance';

  return (
    <TouchableOpacity style={styles.matchCard} onPress={onPress} activeOpacity={0.9}>
      <TouchableOpacity style={styles.cardDismiss} onPress={onDismiss} hitSlop={8}>
        <Ionicons name="close" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <View style={styles.jobTop}>
        {job.logo ? (
          <Image source={imageSource(job.logo)} style={styles.jobLogo} contentFit="cover" />
        ) : (
          <View style={styles.jobLogoPlaceholder}>
            <Text style={styles.jobLogoText}>{job.company.charAt(0)}</Text>
          </View>
        )}
        <View style={styles.jobInfo}>
          <View style={styles.jobTitleRow}>
            <Text style={styles.jobTitle} numberOfLines={1}>
              {job.title}
            </Text>
            <View style={styles.jobTypeBadge}>
              <Text style={styles.jobTypeText}>{typeLabel}</Text>
            </View>
          </View>
          <Text style={styles.jobCompany} numberOfLines={1}>
            {job.company}
          </Text>
        </View>
      </View>

      <View style={styles.jobMetaRow}>
        <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.jobMetaText} numberOfLines={1}>
          {job.location}
        </Text>
      </View>
      <View style={styles.jobMetaRow}>
        <Ionicons name="cash-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.jobMetaText} numberOfLines={1}>
          {job.salary}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function ServiceMatchCard({
  service,
  onPress,
  onDismiss,
}: {
  service: Service;
  onPress: () => void;
  onDismiss: () => void;
}) {
  return (
    <TouchableOpacity style={styles.matchCard} onPress={onPress} activeOpacity={0.9}>
      <TouchableOpacity style={styles.cardDismiss} onPress={onDismiss} hitSlop={8}>
        <Ionicons name="close" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <View style={styles.jobTop}>
        <Image
          source={{ uri: service.images[0] }}
          style={styles.jobLogo}
          contentFit="cover"
        />
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle} numberOfLines={1}>
            {service.title}
          </Text>
          <View style={styles.ratingInline}>
            <Ionicons name="star" size={12} color={colors.warning} />
            <Text style={styles.ratingInlineText}>{service.rating.toFixed(1)}</Text>
            <Text style={styles.ratingCountText}>({service.reviewCount})</Text>
          </View>
          <Text style={styles.jobCompany} numberOfLines={1}>
            {service.provider.name}
          </Text>
        </View>
      </View>

      <View style={styles.jobMetaRow}>
        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.jobMetaText} numberOfLines={1}>
          {service.duration}
        </Text>
      </View>
      <View style={styles.jobMetaRow}>
        <Ionicons name="cash-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.jobMetaText} numberOfLines={1}>
          {service.priceLabel ?? `${service.price} ${service.currency}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function TalentMatchCard({
  talent,
  onPress,
  onDismiss,
}: {
  talent: Talent;
  onPress: () => void;
  onDismiss: () => void;
}) {
  return (
    <TouchableOpacity style={styles.matchCard} onPress={onPress} activeOpacity={0.9}>
      <TouchableOpacity style={styles.cardDismiss} onPress={onDismiss} hitSlop={8}>
        <Ionicons name="close" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <View style={styles.jobTop}>
        <Image
          source={imageSource(talent.user.avatar)}
          style={styles.talentAvatar}
          contentFit="cover"
        />
        <View style={styles.jobInfo}>
          <View style={styles.jobTitleRow}>
            <Text style={styles.jobTitle} numberOfLines={1}>
              {talent.user.name}
            </Text>
            {talent.user.isVerified ? (
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            ) : null}
          </View>
          <Text style={styles.jobCompany} numberOfLines={1}>
            {talent.user.title ?? talent.category}
          </Text>
          <View style={styles.ratingInline}>
            <Ionicons name="star" size={12} color={colors.warning} />
            <Text style={styles.ratingInlineText}>{talent.rating.toFixed(1)}</Text>
            <Text style={styles.ratingCountText}>({talent.reviewCount ?? 0})</Text>
          </View>
        </View>
      </View>

      <View style={styles.jobMetaRow}>
        <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.jobMetaText} numberOfLines={1}>
          {talent.user.location ?? 'Riyadh'}
        </Text>
      </View>
      <View style={styles.jobMetaRow}>
        <Ionicons name="cash-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.jobMetaText} numberOfLines={1}>
          {talent.rateLabel ?? `${talent.hourlyRate} / hr`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }: TabScreenProps<'HomeTab'>) {
  const { open: openSidebar } = useSidebar();
  const { user: me } = useMyProfile();
  const [feedPosts, setFeedPosts] = useState(posts);
  const [jobList, setJobList] = useState(jobs);
  const [serviceList, setServiceList] = useState(services);
  const [talentList, setTalentList] = useState(talents);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleLike = (postId: string) => {
    setFeedPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  };

  const toggleBookmark = (postId: string) => {
    setFeedPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isSaved: !p.isSaved } : p))
    );
  };

  const sharePost = async (post: Post) => {
    const url = `https://mawahib.app/p/${post.id}`;
    const message = `Check out this post on Mawahib`;
    try {
      await Share.share(
        Platform.OS === 'ios'
          ? { message, url }
          : { message: `${message}\n${url}`, title: 'Mawahib' }
      );
    } catch {
      Alert.alert('Share unavailable', `${message}\n${url}`);
    }
  };

  const openPostDetail = (postId: string, focusComments = false) => {
    navigation.navigate('PostDetail', { postId, focusComments });
  };

  const openExplore = (contentType: 'jobs' | 'services' | 'talents') => {
    navigation.navigate('SearchTab', { contentType });
  };

  const renderFeedPost = (post: Post) => (
    <FeedPostCard
      key={post.id}
      post={post}
      onPress={() => openPostDetail(post.id)}
      onLike={() => toggleLike(post.id)}
      onComment={() => openPostDetail(post.id, true)}
      onShare={() => sharePost(post)}
      onBookmark={() => toggleBookmark(post.id)}
      onAuthorPress={() => openUserProfile(navigation, post.author.id, me.id)}
    />
  );

  return (
    <ScreenContainer padded={false} safeBottom={false} safeTop={false}>
      <StatusBar style="dark" />
      <AppHeader
        onAvatarPress={openSidebar}
        onNotificationPress={() => navigation.navigate('Notifications')}
        notificationCount={unreadCount}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <FlatList
          data={stories}
          horizontal
          scrollEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.storiesList}
          renderItem={({ item }) => (
            <StoryItem
              story={item}
              onPress={() =>
                navigation.navigate('StoryViewer', { storyId: item.id })
              }
            />
          )}
        />

        {feedPosts[0] ? renderFeedPost(feedPosts[0]) : null}

        {jobList.length > 0 ? (
          <>
            <SectionHeader
              title="Jobs matches for you"
              onPress={() => openExplore('jobs')}
            />
            <FlatList
              data={jobList}
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.carousel}
              renderItem={({ item }) => (
                <JobMatchCard
                  job={item}
                  onPress={() =>
                    navigation.navigate('JobListingDetail', { jobId: item.id })
                  }
                  onDismiss={() =>
                    setJobList((prev) => prev.filter((j) => j.id !== item.id))
                  }
                />
              )}
            />
          </>
        ) : null}

        {feedPosts[1] ? renderFeedPost(feedPosts[1]) : null}

        {serviceList.length > 0 ? (
          <>
            <SectionHeader
              title="Services for you"
              onPress={() => openExplore('services')}
            />
            <FlatList
              data={serviceList}
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.carousel}
              renderItem={({ item }) => (
                <ServiceMatchCard
                  service={item}
                  onPress={() =>
                    navigation.navigate('ServiceDetail', { serviceId: item.id })
                  }
                  onDismiss={() =>
                    setServiceList((prev) => prev.filter((s) => s.id !== item.id))
                  }
                />
              )}
            />
          </>
        ) : null}

        {feedPosts[2] ? renderFeedPost(feedPosts[2]) : null}

        {talentList.length > 0 ? (
          <>
            <SectionHeader
              title="Talents for you"
              onPress={() => openExplore('talents')}
            />
            <FlatList
              data={talentList}
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[styles.carousel, styles.carouselLast]}
              renderItem={({ item }) => (
                <TalentMatchCard
                  talent={item}
                  onPress={() => openUserProfile(navigation, item.user.id, me.id)}
                  onDismiss={() =>
                    setTalentList((prev) => prev.filter((t) => t.id !== item.id))
                  }
                />
              )}
            />
          </>
        ) : null}

        {/* Any remaining posts after the suggested carousels */}
        {feedPosts.slice(3).map((post) => renderFeedPost(post))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 120 },
  storiesList: {
    paddingHorizontal: 0,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  storyItem: { alignItems: 'center', width: 72 },
  storyCard: {
    width: 68,
    height: 88,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.background,
    backgroundColor: colors.border,
  },
  storyCardActive: { borderColor: colors.primary },
  storyImage: { width: '100%', height: '100%', borderRadius: 8 },
  storyAddButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  storyName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    width: 72,
  },
  feedCard: {
    backgroundColor: colors.white,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
    paddingHorizontal: spacing.screen,
  },
  feedAvatar: { width: 40, height: 40, borderRadius: radius.avatar },
  feedAuthor: { flex: 1 },
  feedAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  feedAuthorName: { ...typography.label, color: colors.text },
  feedRole: { ...typography.caption, color: colors.textSecondary },
  feedTime: { ...typography.caption, color: colors.textSecondary },
  feedCaption: {
    ...typography.bodySmall,
    color: colors.text,
    lineHeight: 20,
    paddingHorizontal: spacing.screen,
  },
  seeMore: { color: colors.primary },
  feedImage: {
    width: '100%',
    height: 220,
    marginTop: spacing.md,
    backgroundColor: colors.borderLight,
  },
  feedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.md,
    paddingHorizontal: spacing.screen,
  },
  feedAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  feedActionCount: { ...typography.bodySmall, color: colors.textTertiary },
  feedActionSpacer: { flex: 1 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.h3, color: colors.text },
  carousel: {
    paddingHorizontal: spacing.screen,
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  carouselLast: {
    paddingBottom: spacing.xxxl,
  },
  matchCard: {
    width: 280,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardDismiss: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 1,
  },
  jobTop: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    paddingRight: 20,
  },
  jobLogo: { width: 48, height: 48, borderRadius: 8 },
  talentAvatar: { width: 48, height: 48, borderRadius: 24 },
  jobLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobLogoText: { ...typography.label, color: colors.textSecondary },
  jobInfo: { flex: 1 },
  jobTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  jobTitle: { ...typography.label, color: colors.text, flexShrink: 1 },
  jobTypeBadge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  jobTypeText: { ...typography.caption, color: '#193CB8', fontSize: 11 },
  jobCompany: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  ratingInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  ratingInlineText: { ...typography.caption, color: colors.text, fontWeight: '600' },
  ratingCountText: { ...typography.caption, color: colors.textSecondary },
  jobMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  jobMetaText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
});
