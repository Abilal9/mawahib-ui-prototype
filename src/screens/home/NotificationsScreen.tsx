import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { toImageSource } from '../../utils/image';
import { colors, spacing, radius, typography } from '../../theme';
import { notifications } from '../../data/mock/notifications';
import { ScreenProps } from '../../navigation/types';
import { Notification } from '../../data/types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function NotificationIcon({ type }: { type: Notification['type'] }) {
  const icons: Record<Notification['type'], keyof typeof Ionicons.glyphMap> = {
    like: 'heart',
    comment: 'chatbubble',
    follow: 'person-add',
    job: 'briefcase',
    message: 'mail',
    system: 'megaphone',
  };
  return (
    <View style={styles.iconCircle}>
      <Ionicons name={icons[type]} size={18} color={colors.primary} />
    </View>
  );
}

function NotificationItem({ item }: { item: Notification }) {
  return (
    <TouchableOpacity
      style={[styles.item, !item.read && styles.itemUnread]}
      activeOpacity={0.8}
    >
      {item.user ? (
        <Image source={toImageSource(item.user!.avatar)} style={styles.avatar} contentFit="cover" />
      ) : (
        <NotificationIcon type={item.type} />
      )}
      <View style={styles.content}>
        <Text style={styles.message}>
          {item.user && <Text style={styles.userName}>{item.user.name} </Text>}
          {item.message}
        </Text>
        <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen({ navigation }: ScreenProps<'Notifications'>) {
  return (
    <ScreenContainer padded={false}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.backButton} />
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NotificationItem item={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
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
    paddingVertical: spacing.md,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.h3, color: colors.text },
  list: { paddingHorizontal: spacing.screen, paddingBottom: spacing.xxxl },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  itemUnread: { backgroundColor: colors.primary + '08' },
  avatar: { width: 44, height: 44, borderRadius: radius.avatar },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.avatar,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  message: { ...typography.bodySmall, color: colors.text, lineHeight: 20 },
  userName: { fontFamily: typography.label.fontFamily },
  time: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
});
