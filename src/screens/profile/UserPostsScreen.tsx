import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { colors, spacing, radius, typography } from '../../theme';
import { usePosts } from '../../context/PostsContext';
import { useMyProfile } from '../../context/ProfileContext';
import { useVisitorUser } from '../../hooks/useVisitorUser';
import { Post } from '../../data/types';
import { ScreenProps } from '../../navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COL = 3;
const GAP = spacing.xs;
const TILE =
  (SCREEN_WIDTH - spacing.screen * 2 - GAP * (COL - 1)) / COL;

/**
 * Full list of a user's posts (own or visitor). Opened from profile Posts
 * tab via "View more" after the preview of the first two.
 */
export default function UserPostsScreen({
  route,
  navigation,
}: ScreenProps<'UserPosts'>) {
  const insets = useSafeAreaInsets();
  const { user: me, content } = useMyProfile();
  const { posts } = usePosts();
  const userId = route.params?.userId;
  const isOwn = !userId || userId === me.id;
  const visitorUser = useVisitorUser(isOwn ? undefined : userId);
  const profileUser = isOwn ? me : visitorUser.user;

  const userPosts = useMemo(() => {
    if (isOwn) {
      return content.postIds
        .map((id) => posts.find((p) => p.id === id))
        .filter((p): p is Post => Boolean(p));
    }
    return posts.filter((p) => p.author.id === userId);
  }, [isOwn, content.postIds, userId, posts]);

  const title = profileUser
    ? isOwn
      ? 'My Posts'
      : `${profileUser.name.split(' ')[0]}'s Posts`
    : 'Posts';

  return (
    <ScreenContainer padded={false} safeTop={false} backgroundColor={colors.white}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        {isOwn ? (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('PostCreate')}
            hitSlop={8}
          >
            <Ionicons name="add-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>

      <FlatList
        data={userPosts}
        keyExtractor={(item) => item.id}
        numColumns={COL}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.empty}>No posts yet.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.tile}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
          >
            <Image
              source={{ uri: item.images[0] }}
              style={styles.tileImage}
              contentFit="cover"
            />
            {item.images.length > 1 ? (
              <View style={styles.multiBadge}>
                <Ionicons name="copy-outline" size={12} color={colors.white} />
              </View>
            ) : null}
          </TouchableOpacity>
        )}
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
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  grid: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
  },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: radius.button,
    overflow: 'hidden',
    backgroundColor: colors.borderLight,
  },
  tileImage: { width: '100%', height: '100%' },
  multiBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingTop: spacing.xxl,
  },
});
