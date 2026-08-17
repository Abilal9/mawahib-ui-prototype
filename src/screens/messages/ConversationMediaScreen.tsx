import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import ChatImageLightbox from '../../components/messaging/ChatImageLightbox';
import { colors, spacing, typography } from '../../theme';
import { messagingApi, type ConversationMediaItem } from '../../services/messagingApi';
import { ScreenProps } from '../../navigation/types';

const COLUMNS = 3;
const GAP = 2;

export default function ConversationMediaScreen({
  navigation,
  route,
}: ScreenProps<'ConversationMedia'>) {
  const { conversationId } = route.params;
  const { width } = useWindowDimensions();
  const cellSize = Math.floor((width - GAP * (COLUMNS - 1)) / COLUMNS);

  const [items, setItems] = useState<ConversationMediaItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const loadFirst = useCallback(async () => {
    setLoading(true);
    try {
      const page = await messagingApi.listConversationMedia(conversationId, {
        limit: 40,
      });
      setItems(page.items);
      setNextCursor(page.nextCursor);
    } catch (e) {
      console.warn('[conversation-media] load failed', e);
      setItems([]);
      setNextCursor(null);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useFocusEffect(
    useCallback(() => {
      void loadFirst();
    }, [loadFirst]),
  );

  const loadMore = async () => {
    if (!nextCursor || loadingMore || loading) return;
    setLoadingMore(true);
    try {
      const page = await messagingApi.listConversationMedia(conversationId, {
        cursor: nextCursor,
        limit: 40,
      });
      setItems((prev) => [...prev, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (e) {
      console.warn('[conversation-media] load more failed', e);
    } finally {
      setLoadingMore(false);
    }
  };

  const urls = items
    .map((i) => i.url)
    .filter((u): u is string => typeof u === 'string' && u.length > 0);

  const openAt = (item: ConversationMediaItem) => {
    if (!item.url) return;
    const index = urls.indexOf(item.url);
    setLightboxIndex(index >= 0 ? index : 0);
    setLightboxOpen(true);
  };

  return (
    <ScreenContainer padded={false} safeBottom={false}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          hitSlop={8}
          accessibilityLabel="Back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Media</Text>
        <View style={styles.headerBtn} />
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={COLUMNS}
          onEndReached={() => void loadMore()}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <Text style={styles.empty}>No media has been shared yet.</Text>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                style={styles.footerSpinner}
                color={colors.primary}
              />
            ) : null
          }
          renderItem={({ item, index }) => {
            const col = index % COLUMNS;
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => openAt(item)}
                style={{
                  width: cellSize,
                  height: cellSize,
                  marginRight: col < COLUMNS - 1 ? GAP : 0,
                  marginBottom: GAP,
                  backgroundColor: colors.background,
                }}
              >
                {item.url ? (
                  <Image
                    source={{ uri: item.url }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    recyclingKey={item.id}
                  />
                ) : null}
              </TouchableOpacity>
            );
          }}
        />
      )}

      <ChatImageLightbox
        visible={lightboxOpen}
        images={urls}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.lg,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...typography.h2, color: colors.text },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  footerSpinner: { marginVertical: spacing.lg },
});
