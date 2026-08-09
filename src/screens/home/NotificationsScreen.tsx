import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { colors, spacing, radius, typography } from '../../theme';
import {
  NOTIFICATION_TABS,
  NotificationTab,
  filterNotifications,
} from '../../data/mock/notifications';
import { ScreenProps } from '../../navigation/types';
import { Notification } from '../../data/types';
import { useUserJobs } from '../../context/UserJobsContext';
import { useMyProfile } from '../../context/ProfileContext';
import { useNotifications } from '../../context/NotificationsContext';
import { openUserProfile } from '../../utils/openUserProfile';

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  if (sameDay) return `Today at ${time}`;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function NotificationIcon({ type }: { type: Notification['type'] }) {
  const icons: Record<Notification['type'], keyof typeof Ionicons.glyphMap> = {
    like: 'heart-outline',
    comment: 'chatbubble-outline',
    follow: 'people-outline',
    job: 'briefcase-outline',
    message: 'mail-outline',
    system: 'notifications-outline',
  };
  return (
    <View style={styles.iconCircle}>
      <Ionicons name={icons[type]} size={18} color={colors.textTertiary} />
    </View>
  );
}

function NotificationItem({
  item,
  onPress,
  onAccept,
  onDecline,
  onRate,
}: {
  item: Notification;
  onPress: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  onRate?: (rating: number) => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.item, !item.read && styles.itemUnread]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <NotificationIcon type={item.type} />
      <View style={styles.content}>
        <Text style={styles.title}>{item.title ?? 'Notification'}</Text>
        <Text style={styles.message}>{item.message}</Text>

        {item.actions?.includes('accept') ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.acceptBtn} onPress={onAccept} activeOpacity={0.85}>
              <Text style={styles.acceptText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.declineBtn} onPress={onDecline} activeOpacity={0.85}>
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {item.showRating ? (
          <View style={styles.starsRow}>
            {Array.from({ length: 5 }).map((_, i) => {
              const value = i + 1;
              return (
                <TouchableOpacity
                  key={value}
                  hitSlop={6}
                  activeOpacity={0.75}
                  onPress={() => onRate?.(value)}
                >
                  <Ionicons name="star-outline" size={18} color={colors.border} />
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
      </View>
      {!item.read ? <View style={styles.unreadDot} /> : null}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen({ navigation }: ScreenProps<'Notifications'>) {
  const { getJobById, acceptJob, declineJob } = useUserJobs();
  const { user: me } = useMyProfile();
  const {
    notifications,
    markRead,
    markAllRead,
    clearActions,
    clearRatingPrompt,
    remove,
  } = useNotifications();
  const [activeTab, setActiveTab] = useState<NotificationTab>('All');

  const filtered = useMemo(
    () => filterNotifications(notifications, activeTab),
    [notifications, activeTab]
  );

  const clearAll = () => {
    markAllRead();
  };

  const resolveUserJobId = (item: Notification) => {
    if (item.userJobId) {
      const byUserJob = getJobById(item.userJobId);
      if (byUserJob) return byUserJob.id;
    }
    if (item.jobId) {
      const byListing = getJobById(item.jobId);
      if (byListing) return byListing.id;
    }
    return undefined;
  };

  const openNotification = (item: Notification) => {
    markRead(item.id);

    switch (item.type) {
      case 'job': {
        const userJobId = resolveUserJobId(item);
        if (userJobId) {
          navigation.navigate('JobInProgress', { jobId: userJobId });
        } else if (item.jobId) {
          navigation.navigate('JobListingDetail', { jobId: item.jobId });
        } else {
          navigation.navigate('MainTabs', { screen: 'JobsTab' });
        }
        break;
      }
      case 'message':
        if (item.conversationId) {
          navigation.navigate('Chat', { conversationId: item.conversationId });
        } else {
          navigation.navigate('MainTabs', { screen: 'MessagesTab' });
        }
        break;
      case 'follow':
        if (item.user?.id) {
          openUserProfile(navigation, item.user.id, me.id);
        } else {
          navigation.navigate('Connections');
        }
        break;
      case 'system':
        navigation.navigate('MainTabs', { screen: 'HomeTab' });
        break;
      case 'like':
      case 'comment':
        if (item.postId) {
          navigation.navigate('PostDetail', { postId: item.postId });
        }
        break;
      default:
        break;
    }
  };

  const onTabPress = (tab: NotificationTab) => {
    setActiveTab(tab);
  };

  return (
    <ScreenContainer padded={false} backgroundColor={colors.white}>
      <StatusBar style="dark" />

      <View style={styles.stickyTop}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity onPress={clearAll} hitSlop={8}>
            <Text style={styles.clearAll}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabs}
        >
          {NOTIFICATION_TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={styles.tab}
                onPress={() => onTabPress(tab)}
                activeOpacity={0.85}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab}</Text>
                <View style={[styles.tabUnderline, !active && styles.tabUnderlineHidden]} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        style={styles.listFlex}
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            item={item}
            onPress={() => openNotification(item)}
            onAccept={() => {
              const userJobId = resolveUserJobId(item);
              if (userJobId) {
                acceptJob(userJobId);
              }
              clearActions(item.id);
              if (userJobId) {
                navigation.navigate('JobInProgress', { jobId: userJobId });
              } else {
                navigation.navigate('MainTabs', { screen: 'JobsTab' });
              }
            }}
            onDecline={() => {
              const userJobId = resolveUserJobId(item);
              if (userJobId) {
                declineJob(userJobId);
              }
              remove(item.id);
            }}
            onRate={(rating) => {
              clearRatingPrompt(item.id);
              const userJobId = resolveUserJobId(item);
              if (userJobId) {
                navigation.navigate('WriteReview', {
                  jobId: userJobId,
                  initialRating: rating,
                });
              }
            }}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.empty}>No notifications in this category.</Text>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  stickyTop: {
    backgroundColor: colors.white,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...typography.h3, color: colors.text, fontWeight: '700' },
  clearAll: { ...typography.caption, color: colors.textSecondary },
  tabsScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  tabs: {
    paddingHorizontal: spacing.screen,
    gap: spacing.lg,
    alignItems: 'flex-end',
    minHeight: 40,
  },
  tab: {
    justifyContent: 'flex-end',
  },
  tabText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
    paddingBottom: spacing.sm,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  tabUnderline: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  tabUnderlineHidden: {
    backgroundColor: 'transparent',
  },
  listFlex: {
    flex: 1,
  },
  list: {
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    gap: spacing.md,
  },
  itemUnread: {
    backgroundColor: '#F0F7FF',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, gap: 4 },
  title: { ...typography.label, color: colors.text, fontWeight: '600' },
  message: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 20 },
  time: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  acceptBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  acceptText: { ...typography.caption, color: colors.white, fontWeight: '600' },
  declineBtn: {
    backgroundColor: colors.white,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  declineText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing.xs,
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: spacing.screen + 40 + spacing.md,
  },
  empty: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xxxl,
  },
});
