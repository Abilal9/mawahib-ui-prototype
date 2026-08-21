import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  Modal,
  Pressable,
  Share,
  Platform,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import UserAvatar from '../../components/ui/UserAvatar';
import { colors, spacing, radius, typography } from '../../theme';
import { Comment } from '../../data/types';
import { useMyProfile } from '../../context/ProfileContext';
import { usePosts } from '../../context/PostsContext';
import { openUserProfile } from '../../utils/openUserProfile';
import { ScreenProps } from '../../navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SEED_COMMENTS: Comment[] = [
  { id: 'c1', userId: 'u2', user: 'Omar Hassan', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', text: 'This is absolutely stunning! 🔥', time: '2h ago' },
  { id: 'c2', userId: 'u3', user: 'Fatima Al-Zahra', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', text: 'Love the color palette you used here', time: '4h ago' },
  { id: 'c3', userId: 'u-khalid', user: 'Khalid Mansour', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', text: 'Would love to collaborate on something similar', time: '6h ago' },
];

export default function PostDetailScreen({ route, navigation }: ScreenProps<'PostDetail'>) {
  const { getPostById, getComments, addComment } = usePosts();
  const post = getPostById(route.params.postId);
  const focusComments = route.params.focusComments === true;
  const { user, removePostId } = useMyProfile();
  const scrollRef = useRef<ScrollView>(null);
  const commentsY = useRef(0);
  const [activeImage, setActiveImage] = useState(0);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>(() => {
    const stored = getComments(route.params.postId);
    return stored.length > 0 ? stored : SEED_COMMENTS;
  });
  const [liked, setLiked] = useState(post?.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(post?.likes ?? 0);
  const [saved, setSaved] = useState(post?.isSaved ?? false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!focusComments || !post) return;
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(commentsY.current - 12, 0), animated: true });
    }, 250);
    return () => clearTimeout(t);
  }, [focusComments, post]);

  if (!post) {
    return (
      <ScreenContainer>
        <View style={styles.missingWrap}>
          <Text style={styles.missingText}>Post not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.missingBack}>
            <Text style={styles.missingBackText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // Only the real author gets the ⋯ menu (Share / Delete) — not posts merely listed on a profile.
  const isOwnPost = post.author.id === user.id;

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  const sharePost = async () => {
    setMenuOpen(false);
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

  const confirmDelete = () => {
    removePostId(post.id);
    setDeleteOpen(false);
    navigation.goBack();
  };

  return (
    <ScreenContainer padded={false}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={styles.headerRight}>
          {isOwnPost ? (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setMenuOpen(true)}
              hitSlop={8}
            >
              <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.headerButton} onPress={sharePost} hitSlop={8}>
              <Ionicons name="share-outline" size={22} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.authorRow}
          onPress={() => openUserProfile(navigation, post.author.id, user.id)}
          activeOpacity={0.8}
        >
          <UserAvatar uri={post.author.avatar} size={44} style={styles.avatar} />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{post.author.name}</Text>
            {post.role || post.author.title ? (
              <Text style={styles.authorMeta}>
                {post.role ?? post.author.title}
              </Text>
            ) : null}
          </View>
          {/* Follow/Connect lives on the profile — avoid a dead control here */}
        </TouchableOpacity>

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
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() =>
                scrollRef.current?.scrollTo({
                  y: Math.max(commentsY.current - 12, 0),
                  animated: true,
                })
              }
            >
              <Ionicons name="chatbubble-outline" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={sharePost}>
              <Ionicons name="paper-plane-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => setSaved((s) => !s)}>
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={saved ? colors.primary : colors.text}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.likes}>{likeCount.toLocaleString()} likes</Text>
        <Text style={styles.caption}>
          <Text style={styles.captionAuthor}>{post.author.name} </Text>
          {post.caption}
        </Text>

        <View
          style={styles.commentsSection}
          onLayout={(e) => {
            commentsY.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.commentsTitle}>Comments</Text>
          {comments.map((c) => (
            <View key={c.id} style={styles.comment}>
              <TouchableOpacity
                onPress={() => openUserProfile(navigation, c.userId, user.id)}
                activeOpacity={0.8}
                hitSlop={4}
              >
                <UserAvatar uri={c.avatar} size={36} style={styles.commentAvatar} />
              </TouchableOpacity>
              <View style={styles.commentBody}>
                <TouchableOpacity
                  onPress={() => openUserProfile(navigation, c.userId, user.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.commentUser}>{c.user}</Text>
                </TouchableOpacity>
                <Text style={styles.commentText}>{c.text}</Text>
                <Text style={styles.commentTime}>{c.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.inputBar}>
        <UserAvatar uri={user.avatar} size={32} style={styles.inputAvatar} />
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          placeholderTextColor={colors.textSecondary}
          value={comment}
          onChangeText={setComment}
        />
        <TouchableOpacity
          disabled={!comment.trim()}
          onPress={() => {
            const text = comment.trim();
            if (!text || !post) return;
            const avatar =
              typeof user.avatar === 'string' ? user.avatar : '';
            const created = addComment(post.id, {
              userId: user.id,
              user: user.name,
              avatar,
              text,
              time: 'Just now',
            });
            setComments((prev) => [...prev, created]);
            setComment('');
          }}
        >
          <Text style={[styles.postComment, !comment.trim() && styles.postCommentDisabled]}>Post</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setMenuOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <TouchableOpacity style={styles.sheetRow} onPress={sharePost} activeOpacity={0.85}>
              <Ionicons name="share-outline" size={22} color={colors.text} />
              <Text style={styles.sheetRowText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sheetRow}
              onPress={() => {
                setMenuOpen(false);
                setDeleteOpen(true);
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="trash-outline" size={22} color={colors.error} />
              <Text style={[styles.sheetRowText, styles.sheetRowDanger]}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sheetRow, styles.sheetCancel]}
              onPress={() => setMenuOpen(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={deleteOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setDeleteOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Delete post?</Text>
            <Text style={styles.modalBody}>
              Are you sure you want to delete this post? This can’t be undone.
            </Text>
            <TouchableOpacity
              style={styles.modalDangerBtn}
              onPress={confirmDelete}
              activeOpacity={0.85}
            >
              <Text style={styles.modalDangerText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setDeleteOpen(false)}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
  },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerRight: { minWidth: 40, alignItems: 'flex-end' },
  headerTitle: { ...typography.h3, color: colors.text },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sheetRowText: { ...typography.bodyMedium, color: colors.text },
  sheetRowDanger: { color: colors.error },
  sheetCancel: {
    borderBottomWidth: 0,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  sheetCancelText: {
    ...typography.button,
    color: colors.textSecondary,
    textAlign: 'center',
    width: '100%',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.xl,
  },
  modalTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  modalBody: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.lg,
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
  authorMeta: { ...typography.caption, color: colors.textSecondary },
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
});
