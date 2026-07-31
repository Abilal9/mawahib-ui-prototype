import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { toImageSource } from '../../utils/image';
import { colors, spacing, radius, typography } from '../../theme';
import { conversations } from '../../data/mock/messages';
import { useConnections } from '../../context/ConnectionsContext';
import { TabScreenProps } from '../../navigation/types';

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function MessagesInboxScreen({ navigation }: TabScreenProps<'MessagesTab'>) {
  const { isConnected } = useConnections();
  const visible = useMemo(
    () => conversations.filter((c) => isConnected(c.participant.id)),
    [isConnected]
  );

  return (
    <ScreenContainer padded={false} safeBottom={false}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Messages appear here once you’re connected with someone.
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.conversation}
            onPress={() => navigation.navigate('Chat', { conversationId: item.id })}
            activeOpacity={0.8}
          >
            <Image source={toImageSource(item.participant.avatar)} style={styles.avatar} contentFit="cover" />
            <View style={styles.content}>
              <View style={styles.topRow}>
                <Text style={styles.name}>{item.participant.name}</Text>
                <Text style={styles.time}>{formatTime(item.lastMessageAt)}</Text>
              </View>
              <View style={styles.bottomRow}>
                <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
                {item.unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.unreadCount}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.screen, paddingVertical: spacing.lg },
  headerTitle: { ...typography.h2, color: colors.text },
  list: { paddingHorizontal: spacing.screen, paddingBottom: 120 },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  conversation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  avatar: { width: 52, height: 52, borderRadius: radius.avatar },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { ...typography.label, color: colors.text },
  time: { ...typography.caption, color: colors.textSecondary },
  bottomRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  lastMessage: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: spacing.sm,
  },
  badgeText: { ...typography.caption, color: colors.white, fontSize: 11, fontWeight: '700' },
});
