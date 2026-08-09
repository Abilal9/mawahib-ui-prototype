import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { toImageSource } from '../../utils/image';
import { colors, spacing, radius, typography } from '../../theme';
import { useConnections } from '../../context/ConnectionsContext';
import { useMyProfile } from '../../context/ProfileContext';
import { connectionService, userService } from '../../services';
import { User } from '../../data/types';
import { openUserProfile } from '../../utils/openUserProfile';
import { ScreenProps } from '../../navigation/types';

type ConnectionsTab = 'requests' | 'connections';

export default function ConnectionsScreen({
  navigation,
  route,
}: ScreenProps<'Connections'>) {
  const viewedUserId = route.params?.userId;
  const { user: me } = useMyProfile();
  const isOwn = !viewedUserId || viewedUserId === me.id;
  const { connectedUsers, incomingUsers, acceptRequest, denyRequest } = useConnections();
  const [tab, setTab] = useState<ConnectionsTab>(
    isOwn && incomingUsers.length > 0 ? 'requests' : 'connections'
  );

  const viewedUser = viewedUserId
    ? userService.resolveProfileUser(viewedUserId) ??
      userService.getByIdSync(viewedUserId)
    : undefined;
  const visitorConnections = useMemo(
    () => (viewedUserId ? connectionService.getConnectionsForUser(viewedUserId) : []),
    [viewedUserId]
  );

  const data: User[] = isOwn
    ? tab === 'requests'
      ? incomingUsers
      : connectedUsers
    : visitorConnections;

  const header = useMemo(() => {
    if (!isOwn) {
      return (
        <Text style={styles.count}>
          {visitorConnections.length} connection
          {visitorConnections.length === 1 ? '' : 's'}
        </Text>
      );
    }

    return (
      <View>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setTab('requests')}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, tab === 'requests' && styles.tabTextActive]}>
              Requests{incomingUsers.length > 0 ? ` (${incomingUsers.length})` : ''}
            </Text>
            <View style={[styles.tabUnderline, tab !== 'requests' && styles.tabUnderlineHidden]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setTab('connections')}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, tab === 'connections' && styles.tabTextActive]}>
              Connections ({connectedUsers.length})
            </Text>
            <View
              style={[styles.tabUnderline, tab !== 'connections' && styles.tabUnderlineHidden]}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.count}>
          {tab === 'requests'
            ? incomingUsers.length === 0
              ? 'No pending requests'
              : `${incomingUsers.length} pending request${incomingUsers.length === 1 ? '' : 's'}`
            : `${connectedUsers.length} connection${connectedUsers.length === 1 ? '' : 's'}`}
        </Text>
      </View>
    );
  }, [
    isOwn,
    tab,
    incomingUsers.length,
    connectedUsers.length,
    visitorConnections.length,
  ]);

  const renderConnection = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => openUserProfile(navigation, item.id, me.id)}
      activeOpacity={0.85}
    >
      <Image source={toImageSource(item.avatar)} style={styles.avatar} contentFit="cover" />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{item.name}</Text>
          {item.isVerified ? (
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
          ) : null}
        </View>
        <Text style={styles.username}>@{item.username}</Text>
        {item.location ? <Text style={styles.location}>{item.location}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderRequest = ({ item }: { item: User }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.requestPerson}
        onPress={() => openUserProfile(navigation, item.id, me.id)}
        activeOpacity={0.85}
      >
        <Image source={toImageSource(item.avatar)} style={styles.avatar} contentFit="cover" />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{item.name}</Text>
            {item.isVerified ? (
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            ) : null}
          </View>
          <Text style={styles.username}>@{item.username}</Text>
          {item.title || item.location ? (
            <Text style={styles.location}>{item.title ?? item.location}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={() => acceptRequest(item.id)}
          activeOpacity={0.85}
        >
          <Text style={styles.acceptText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.denyBtn}
          onPress={() => denyRequest(item.id)}
          activeOpacity={0.85}
        >
          <Text style={styles.denyText}>Deny</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const title = isOwn
    ? 'My Connections'
    : viewedUser
      ? `${viewedUser.name.split(' ')[0]}’s Connections`
      : 'Connections';

  return (
    <ScreenContainer padded={false} backgroundColor={colors.white}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.headerButton} />
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={header}
        renderItem={
          isOwn && tab === 'requests' ? renderRequest : renderConnection
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            {isOwn
              ? tab === 'requests'
                ? 'When someone wants to connect, they’ll show up here.'
                : 'People you connect with will appear here.'
              : 'No connections to show yet.'}
          </Text>
        }
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
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.h3, color: colors.text, flex: 1, textAlign: 'center' },
  list: { paddingHorizontal: spacing.screen, paddingBottom: spacing.xxxl },
  tabs: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
  tabText: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: colors.primary },
  tabUnderline: {
    marginTop: spacing.sm,
    height: 2,
    width: '70%',
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  tabUnderlineHidden: { backgroundColor: 'transparent' },
  count: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  requestPerson: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: { width: 52, height: 52, borderRadius: radius.avatar },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { ...typography.label, color: colors.text },
  username: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  location: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  requestActions: { flexDirection: 'row', gap: spacing.sm },
  acceptBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  acceptText: { ...typography.button, color: colors.white, fontSize: 14 },
  denyBtn: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  denyText: { ...typography.button, color: colors.textSecondary, fontSize: 14 },
});
