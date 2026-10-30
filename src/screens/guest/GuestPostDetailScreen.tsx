import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ui/ScreenContainer';
import UserAvatar from '../../components/ui/UserAvatar';
import PostMediaPreview from '../../components/ui/PostMediaPreview';
import GuestScreenHeader from '../../components/guest/GuestScreenHeader';
import {
  GuestStatusBlock,
  guestMediaUrls,
  publicTimeAgo,
} from '../../components/guest/GuestDiscoveryCards';
import { displayProfileTitle } from '../../constants/profile';
import { useGuestPost } from '../../hooks/useGuestPost';
import { colors, spacing, typography } from '../../theme';
import type { SignedOutScreenProps } from '../../navigation/types';

/**
 * Public post detail. Counts are visible; Like/Save/comments thread are not.
 * Phase G owns participation gates.
 */
export default function GuestPostDetailScreen({
  route,
  navigation,
}: SignedOutScreenProps<'PostDetail'>) {
  const { post, loading, error, notFound, refresh } = useGuestPost(
    route.params.postId,
  );
  const images = guestMediaUrls(post?.media);

  return (
    <ScreenContainer padded={false} safeTop={false} backgroundColor={colors.background}>
      <StatusBar style="dark" />
      <GuestScreenHeader onBack={() => navigation.goBack()} title="Post" />
      {loading ? (
        <GuestStatusBlock loading />
      ) : notFound || !post ? (
        <GuestStatusBlock
          error={error || 'This post is unavailable.'}
          onRetry={notFound ? undefined : refresh}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <TouchableOpacity
            style={styles.author}
            onPress={() =>
              navigation.navigate('UserProfile', { userId: post.author.id })
            }
            activeOpacity={0.85}
          >
            <UserAvatar uri={post.author.avatarUrl} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{post.author.displayName}</Text>
              <Text style={styles.meta}>
                {displayProfileTitle(post.author.title)} · {publicTimeAgo(post.createdAt)}
              </Text>
            </View>
          </TouchableOpacity>
          {post.text ? <Text style={styles.text}>{post.text}</Text> : null}
          {images.length > 0 ? <PostMediaPreview images={images} /> : null}
          <View style={styles.counts}>
            <View style={styles.count}>
              <Ionicons name="thumbs-up-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.meta}>{post.likeCount}</Text>
            </View>
            <View style={styles.count}>
              <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.meta}>{post.commentCount}</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { paddingBottom: spacing.xxxl },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
  },
  name: { ...typography.label, color: colors.text },
  meta: { ...typography.caption, color: colors.textSecondary },
  text: {
    ...typography.body,
    color: colors.text,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
  },
  counts: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
  },
  count: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
