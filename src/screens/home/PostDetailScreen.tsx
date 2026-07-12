import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { toImageSource } from '../../utils/image';
import { colors, spacing, radius, typography } from '../../theme';
import { getPostById } from '../../data/mock/posts';
import { ScreenProps } from '../../navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MOCK_COMMENTS = [
  { id: 'c1', user: 'Omar Hassan', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', text: 'This is absolutely stunning! 🔥', time: '2h ago' },
  { id: 'c2', user: 'Fatima Al-Zahra', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', text: 'Love the color palette you used here', time: '4h ago' },
  { id: 'c3', user: 'Khalid Mansour', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', text: 'Would love to collaborate on something similar', time: '6h ago' },
];

export default function PostDetailScreen({ route, navigation }: ScreenProps<'PostDetail'>) {
  const post = getPostById(route.params.postId);
  const [activeImage, setActiveImage] = useState(0);
  const [comment, setComment] = useState('');
  const [liked, setLiked] = useState(post?.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(post?.likes ?? 0);

  if (!post) {
    return (
      <ScreenContainer>
        <Text>Post not found</Text>
      </ScreenContainer>
    );
  }

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  return (
    <ScreenContainer padded={false}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="share-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.authorRow}>
          <Image source={toImageSource(post.author.avatar)} style={styles.avatar} contentFit="cover" />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{post.author.name}</Text>
            <Text style={styles.authorUsername}>@{post.author.username}</Text>
          </View>
          <TouchableOpacity style={styles.followButton}>
            <Text style={styles.followText}>Follow</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setActiveImage(index);
          }}
        >
          {post.images.map((img, i) => (
            <Image key={i} source={{ uri: img }} style={styles.postImage} contentFit="cover" />
          ))}
        </ScrollView>

        {post.images.length > 1 && (
          <View style={styles.dots}>
            {post.images.map((_, i) => (
              <View key={i} style={[styles.dot, i === activeImage && styles.dotActive]} />
            ))}
          </View>
        )}

        <View style={styles.actions}>
          <View style={styles.actionsLeft}>
            <TouchableOpacity onPress={handleLike} style={styles.actionBtn}>
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={26} color={liked ? colors.primary : colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="chatbubble-outline" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="paper-plane-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity>
            <Ionicons name="bookmark-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={styles.likes}>{likeCount.toLocaleString()} likes</Text>
        <Text style={styles.caption}>
          <Text style={styles.captionAuthor}>@{post.author.username} </Text>
          {post.caption}
        </Text>

        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments</Text>
          {MOCK_COMMENTS.map((c) => (
            <View key={c.id} style={styles.comment}>
              <Image source={{ uri: c.avatar }} style={styles.commentAvatar} contentFit="cover" />
              <View style={styles.commentBody}>
                <Text style={styles.commentUser}>{c.user}</Text>
                <Text style={styles.commentText}>{c.text}</Text>
                <Text style={styles.commentTime}>{c.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.inputBar}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' }}
          style={styles.inputAvatar}
          contentFit="cover"
        />
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          placeholderTextColor={colors.textSecondary}
          value={comment}
          onChangeText={setComment}
        />
        <TouchableOpacity disabled={!comment.trim()}>
          <Text style={[styles.postComment, !comment.trim() && styles.postCommentDisabled]}>Post</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
  },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.h3, color: colors.text },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  avatar: { width: 44, height: 44, borderRadius: radius.avatar },
  authorInfo: { flex: 1 },
  authorName: { ...typography.label, color: colors.text },
  authorUsername: { ...typography.caption, color: colors.textSecondary },
  followButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
  },
  followText: { ...typography.label, color: colors.white, fontSize: 13 },
  postImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 18 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.sm,
  },
  actionsLeft: { flexDirection: 'row', gap: spacing.lg },
  actionBtn: { padding: 2 },
  likes: { ...typography.label, color: colors.text, paddingHorizontal: spacing.screen },
  caption: { ...typography.body, color: colors.text, paddingHorizontal: spacing.screen, paddingTop: spacing.sm, lineHeight: 22 },
  captionAuthor: { fontFamily: typography.label.fontFamily },
  commentsSection: { padding: spacing.screen, paddingTop: spacing.xl },
  commentsTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.lg },
  comment: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  commentAvatar: { width: 36, height: 36, borderRadius: 18 },
  commentBody: { flex: 1 },
  commentUser: { ...typography.label, color: colors.text, fontSize: 13 },
  commentText: { ...typography.bodySmall, color: colors.text, marginTop: 2 },
  commentTime: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.white,
    gap: spacing.md,
  },
  inputAvatar: { width: 32, height: 32, borderRadius: 16 },
  commentInput: { flex: 1, ...typography.bodySmall, color: colors.text },
  postComment: { ...typography.label, color: colors.primary },
  postCommentDisabled: { opacity: 0.4 },
});
