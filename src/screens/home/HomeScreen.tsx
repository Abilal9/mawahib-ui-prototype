import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
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
import { notifications } from '../../data/mock/notifications';
import { TabScreenProps } from '../../navigation/types';
import { Post, Job, Story } from '../../data/types';

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
}: {
  post: Post;
  onPress: () => void;
  onLike: () => void;
}) {
  const truncated =
    post.caption.length > 120 ? `${post.caption.slice(0, 120)}...` : post.caption;

  return (
    <TouchableOpacity style={styles.feedCard} onPress={onPress} activeOpacity={0.95}>
      <View style={styles.feedHeader}>
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
      </View>

      <Text style={styles.feedCaption}>
        {truncated}
        {post.caption.length > 120 && (
          <Text style={styles.seeMore}> See more</Text>
        )}
      </Text>

      <View style={styles.feedActions}>
        <TouchableOpacity style={styles.feedAction} onPress={onLike}>
          <Ionicons
            name={post.isLiked ? 'thumbs-up' : 'thumbs-up-outline'}
            size={20}
            color={post.isLiked ? colors.primary : colors.textTertiary}
          />
          <Text style={styles.feedActionCount}>{post.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.feedAction}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.textTertiary} />
          <Text style={styles.feedActionCount}>{post.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.feedAction}>
          <Ionicons name="share-outline" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
        <View style={styles.feedActionSpacer} />
        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
          : 'Freelance';

  return (
    <TouchableOpacity style={styles.jobCard} onPress={onPress} activeOpacity={0.9}>
      <TouchableOpacity style={styles.jobDismiss} onPress={onDismiss} hitSlop={8}>
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
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }: TabScreenProps<'HomeTab'>) {
  const [feedPosts, setFeedPosts] = useState(posts);
  const [jobList, setJobList] = useState(jobs);
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

  return (
    <ScreenContainer padded={false} safeBottom={false}>
      <StatusBar style="dark" />
      <AppHeader
        onAvatarPress={() => navigation.navigate('ProfileTab')}
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
              onPress={() => {
                if (!item.isOwn) {
                  navigation.navigate('StoryViewer', { storyId: item.id });
                }
              }}
            />
          )}
        />

        {feedPosts.map((post) => (
          <FeedPostCard
            key={post.id}
            post={post}
            onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
            onLike={() => toggleLike(post.id)}
          />
        ))}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Jobs matches for you</Text>
          <TouchableOpacity activeOpacity={0.8}>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={jobList}
          horizontal
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.jobsList}
          renderItem={({ item }) => (
            <JobMatchCard
              job={item}
              onPress={() => navigation.navigate('JobInProgress', { jobId: item.id })}
              onDismiss={() => setJobList((prev) => prev.filter((j) => j.id !== item.id))}
            />
          )}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xl },
  storiesList: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  storyItem: { alignItems: 'center', width: 79 },
  storyCard: {
    width: 75,
    height: 95,
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
    width: 79,
  },
  feedCard: {
    marginHorizontal: spacing.screen,
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  feedAvatar: { width: 40, height: 40, borderRadius: radius.avatar },
  feedAuthor: { flex: 1 },
  feedAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  feedAuthorName: { ...typography.label, color: colors.text },
  feedRole: { ...typography.caption, color: colors.textSecondary },
  feedTime: { ...typography.caption, color: colors.textSecondary },
  feedCaption: { ...typography.bodySmall, color: colors.text, lineHeight: 20 },
  seeMore: { color: colors.primary },
  feedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  feedAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  feedActionCount: { ...typography.bodySmall, color: colors.textTertiary },
  feedActionSpacer: { flex: 1 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.h3, color: colors.text },
  jobsList: { paddingHorizontal: spacing.screen, paddingBottom: spacing.xxxl, gap: spacing.md },
  jobCard: {
    width: 280,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  jobDismiss: { position: 'absolute', top: spacing.md, right: spacing.md, zIndex: 1 },
  jobTop: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  jobLogo: { width: 48, height: 48, borderRadius: 8 },
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
  jobTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  jobTitle: { ...typography.label, color: colors.text },
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
  jobMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  jobMetaText: { ...typography.caption, color: colors.textSecondary },
});
