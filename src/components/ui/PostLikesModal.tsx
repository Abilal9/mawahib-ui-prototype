import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UserAvatar from './UserAvatar';
import { colors, radius, spacing, typography } from '../../theme';
import type { User } from '../../data/types';
import { displayProfileTitle } from '../../constants/profile';
import { postService } from '../../services/postService';

type Props = {
  visible: boolean;
  postId: string | null;
  onClose: () => void;
  onOpenProfile: (userId: string) => void;
};

export default function PostLikesModal({
  visible,
  postId,
  onClose,
  onOpenProfile,
}: Props) {
  const [items, setItems] = useState<User[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const page = await postService.listLikes(id);
      setItems(page.items);
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (e) {
      setItems([]);
      setNextCursor(null);
      setHasMore(false);
      setError(e instanceof Error ? e.message : 'Could not load likes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible || !postId) return;
    void load(postId);
  }, [visible, postId, load]);

  const loadMore = async () => {
    if (!postId || !hasMore || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await postService.listLikes(postId, nextCursor);
      setItems((prev) => {
        const seen = new Set(prev.map((u) => u.id));
        return [...prev, ...page.items.filter((u) => !seen.has(u.id))];
      });
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load more');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Likes</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={styles.errorText}>{error}</Text>
              {postId ? (
                <TouchableOpacity onPress={() => void load(postId)}>
                  <Text style={styles.retry}>Retry</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : items.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.empty}>No likes yet</Text>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              style={styles.list}
              onEndReached={() => void loadMore()}
              onEndReachedThreshold={0.4}
              ListFooterComponent={
                loadingMore ? (
                  <ActivityIndicator
                    style={{ marginVertical: spacing.md }}
                    color={colors.primary}
                  />
                ) : null
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => {
                    onClose();
                    onOpenProfile(item.id);
                  }}
                  activeOpacity={0.85}
                >
                  <UserAvatar uri={item.avatar} size={44} style={styles.avatar} />
                  <View style={styles.meta}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.subtitle}>
                      {displayProfileTitle(item.title)}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingBottom: spacing.xxl,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: { ...typography.h3, color: colors.text },
  list: { paddingHorizontal: spacing.screen },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  meta: { flex: 1 },
  name: { ...typography.label, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  center: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 160,
  },
  empty: { ...typography.body, color: colors.textSecondary },
  errorText: { ...typography.bodySmall, color: colors.error, textAlign: 'center' },
  retry: { ...typography.label, color: colors.primary },
});
