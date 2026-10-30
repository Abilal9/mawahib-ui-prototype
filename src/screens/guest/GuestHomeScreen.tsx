import React from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenContainer from '../../components/ui/ScreenContainer';
import GuestAppHeader from '../../components/layout/GuestAppHeader';
import { listPaddingAboveTabBar } from '../../components/layout/CustomTabBar';
import {
  GuestJobCard,
  GuestPostCard,
  GuestSectionHeader,
  GuestServiceCard,
  GuestStatusBlock,
  GuestTalentCard,
} from '../../components/guest/GuestDiscoveryCards';
import { useGuestHome } from '../../hooks/useGuestHome';
import { colors, spacing, typography } from '../../theme';
import type { GuestTabScreenProps } from '../../navigation/types';

/** Public discovery Home. No authenticated feed, providers, or viewer flags. */
export default function GuestHomeScreen({
  navigation,
}: GuestTabScreenProps<'HomeTab'>) {
  const insets = useSafeAreaInsets();
  const home = useGuestHome();
  const openExplore = (contentType?: 'talents' | 'services' | 'jobs') =>
    navigation.navigate('SearchTab', contentType ? { contentType } : undefined);

  const hasItems =
    home.talents.items.length > 0 ||
    home.services.items.length > 0 ||
    home.jobs.items.length > 0 ||
    home.posts.items.length > 0;
  const allEmpty = !home.initialLoading && !hasItems;
  const allFailed =
    allEmpty &&
    Boolean(
      home.talents.error &&
        home.services.error &&
        home.jobs.error &&
        home.posts.error,
    );

  return (
    <ScreenContainer padded={false} safeTop={false} backgroundColor={colors.background}>
      <StatusBar style="dark" />
      <GuestAppHeader />
      {home.initialLoading && !hasItems ? (
        <GuestStatusBlock loading />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: listPaddingAboveTabBar(insets.bottom, spacing.xl),
          }}
          refreshControl={
            <RefreshControl
              refreshing={home.refreshing}
              onRefresh={home.refresh}
              tintColor={colors.primary}
            />
          }
        >
          {allFailed ? (
            <GuestStatusBlock
              error="Unable to load public discovery."
              onRetry={home.refresh}
            />
          ) : home.talents.error && home.talents.items.length === 0 ? (
            <GuestStatusBlock error={home.talents.error} onRetry={home.refresh} />
          ) : home.talents.items.length > 0 ? (
            <>
              <GuestSectionHeader
                title="Talents & businesses"
                onPress={() => openExplore('talents')}
              />
              <FlatList
                data={home.talents.items}
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.carousel}
                renderItem={({ item }) => (
                  <GuestTalentCard
                    talent={item}
                    compact
                    onPress={() =>
                      navigation.navigate('UserProfile', { userId: item.id })
                    }
                  />
                )}
              />
            </>
          ) : null}

          {!allFailed && home.services.error && home.services.items.length === 0 ? (
            <GuestStatusBlock error={home.services.error} onRetry={home.refresh} />
          ) : !allFailed && home.services.items.length > 0 ? (
            <>
              <GuestSectionHeader title="Services" onPress={() => openExplore('services')} />
              <FlatList
                data={home.services.items}
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.carousel}
                renderItem={({ item }) => (
                  <GuestServiceCard
                    service={item}
                    compact
                    onPress={() =>
                      navigation.navigate('ServiceDetail', { serviceId: item.id })
                    }
                    onProviderPress={() =>
                      navigation.navigate('UserProfile', {
                        userId: item.provider.id,
                      })
                    }
                  />
                )}
              />
            </>
          ) : null}

          {!allFailed && home.jobs.error && home.jobs.items.length === 0 ? (
            <GuestStatusBlock error={home.jobs.error} onRetry={home.refresh} />
          ) : !allFailed && home.jobs.items.length > 0 ? (
            <>
              <GuestSectionHeader title="Open jobs" onPress={() => openExplore('jobs')} />
              <FlatList
                data={home.jobs.items}
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.carousel}
                renderItem={({ item }) => (
                  <GuestJobCard
                    job={item}
                    compact
                    onPress={() =>
                      navigation.navigate('JobListingDetail', {
                        listingId: item.id,
                      })
                    }
                  />
                )}
              />
            </>
          ) : null}

          {!allFailed && home.posts.error && home.posts.items.length === 0 ? (
            <GuestStatusBlock error={home.posts.error} onRetry={home.refresh} />
          ) : !allFailed && home.posts.items.length > 0 ? (
            <>
              <GuestSectionHeader title="Newest posts" />
              {home.posts.items.map((post) => (
                <GuestPostCard
                  key={post.id}
                  post={post}
                  onPress={() =>
                    navigation.navigate('PostDetail', { postId: post.id })
                  }
                  onAuthorPress={() =>
                    navigation.navigate('UserProfile', {
                      userId: post.author.id,
                    })
                  }
                />
              ))}
            </>
          ) : null}

          {allEmpty && !allFailed ? (
            <View style={styles.emptyCopy}>
              <Text style={styles.emptyTitle}>Nothing public yet</Text>
              <Text style={styles.emptyText}>
                Public talents, services, jobs, and posts will appear here.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  carousel: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.sm,
  },
  emptyCopy: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xxl,
  },
  emptyTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  emptyText: { ...typography.body, color: colors.textSecondary, lineHeight: 24 },
});
