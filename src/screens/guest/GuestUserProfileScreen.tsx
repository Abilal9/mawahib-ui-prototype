import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import UserAvatar from '../../components/ui/UserAvatar';
import ProfileTabs from '../../components/profile/ProfileTabs';
import GuestScreenHeader from '../../components/guest/GuestScreenHeader';
import {
  GuestPortfolioCard,
  GuestPostCard,
  GuestRating,
  GuestReviewCard,
  GuestServiceCard,
  GuestStatusBlock,
  accountTypeLabel,
  guestLocationLabel,
} from '../../components/guest/GuestDiscoveryCards';
import { useGuestProfile } from '../../hooks/useGuestProfile';
import { displayProfileTitle } from '../../constants/profile';
import { toImageSource } from '../../utils/image';
import { getMediaCacheKey } from '../../lib/mediaCacheKey';
import { colors, spacing, radius, typography } from '../../theme';
import type { ProfileTab } from '../../data/types';
import type { SignedOutScreenProps } from '../../navigation/types';

/**
 * Guest public profile container.
 * Does not mount private profile, connection, or saved providers.
 * Message/Connect are hidden until Phase G auth gates.
 */
export default function GuestUserProfileScreen({
  route,
  navigation,
}: SignedOutScreenProps<'UserProfile'>) {
  const { userId } = route.params;
  const [tab, setTab] = useState<ProfileTab>('About');
  const profileState = useGuestProfile(userId);
  const profile = profileState.profile;
  const location = guestLocationLabel(
    profile?.locationCity,
    profile?.locationCountry,
  );

  if (profileState.profileLoading) {
    return (
      <ScreenContainer padded={false} safeTop={false} backgroundColor={colors.background}>
        <StatusBar style="dark" />
        <GuestScreenHeader onBack={() => navigation.goBack()} title="Profile" />
        <GuestStatusBlock loading />
      </ScreenContainer>
    );
  }

  if (profileState.notFound || !profile) {
    return (
      <ScreenContainer padded={false} safeTop={false} backgroundColor={colors.background}>
        <StatusBar style="dark" />
        <GuestScreenHeader onBack={() => navigation.goBack()} title="Profile" />
        <GuestStatusBlock
          error={profileState.profileError || 'This profile is unavailable.'}
          onRetry={profileState.notFound ? undefined : profileState.refresh}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer padded={false} safeTop={false} backgroundColor={colors.background}>
      <StatusBar style="dark" />
      <GuestScreenHeader
        onBack={() => navigation.goBack()}
        title={profile.displayName}
      />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={profileState.refresh}
            tintColor={colors.primary}
          />
        }
      >
        {profile.coverUrl ? (
          <Image
            source={toImageSource(profile.coverUrl)}
            style={styles.cover}
            contentFit="cover"
            recyclingKey={getMediaCacheKey(profile.coverUrl) ?? profile.coverUrl}
          />
        ) : (
          <View style={[styles.cover, styles.coverFallback]} />
        )}
        <View style={styles.identity}>
          <UserAvatar uri={profile.avatarUrl} size={72} />
          <Text style={styles.name}>{profile.displayName}</Text>
          <Text style={styles.meta}>{displayProfileTitle(profile.title)}</Text>
          {accountTypeLabel(profile.accountType) ? (
            <Text style={styles.meta}>{accountTypeLabel(profile.accountType)}</Text>
          ) : null}
          {location ? <Text style={styles.meta}>{location}</Text> : null}
          <TouchableOpacity
            onPress={() => navigation.navigate('Reviews', { userId: profile.id })}
            accessibilityRole="button"
          >
            <GuestRating summary={profile.reviewSummary.overall} />
          </TouchableOpacity>
        </View>

        <ProfileTabs active={tab} onChange={setTab} />

        {tab === 'About' ? (
          <View style={styles.section}>
            {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
            {profile.skills.length > 0 ? (
              <View style={styles.chips}>
                {profile.skills.map((skill) => (
                  <View key={skill} style={styles.chip}>
                    <Text style={styles.chipText}>{skill}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {!profile.bio && profile.skills.length === 0 ? (
              <Text style={styles.meta}>No public about information.</Text>
            ) : null}
          </View>
        ) : null}

        {tab === 'Portfolio' ? (
          <View style={styles.grid}>
            {profileState.portfolio.loading ? <GuestStatusBlock loading /> : null}
            {profileState.portfolio.error ? (
              <GuestStatusBlock
                error={profileState.portfolio.error}
                onRetry={profileState.refresh}
              />
            ) : null}
            {!profileState.portfolio.loading &&
            profileState.portfolio.items.length === 0 &&
            !profileState.portfolio.error ? (
              <GuestStatusBlock emptyLabel="No public portfolio yet." />
            ) : null}
            {profileState.portfolio.items.map((project) => (
              <GuestPortfolioCard
                key={project.id}
                project={project}
                onPress={() =>
                  navigation.navigate('PortfolioProjectDetail', {
                    projectId: project.id,
                    title: project.title,
                    description: project.description,
                    images: project.images,
                  })
                }
              />
            ))}
          </View>
        ) : null}

        {tab === 'Services' ? (
          <View style={styles.section}>
            {profileState.services.loading ? <GuestStatusBlock loading /> : null}
            {profileState.services.error ? (
              <GuestStatusBlock
                error={profileState.services.error}
                onRetry={profileState.refresh}
              />
            ) : null}
            {!profileState.services.loading &&
            profileState.services.items.length === 0 &&
            !profileState.services.error ? (
              <GuestStatusBlock emptyLabel="No public services yet." />
            ) : null}
            {profileState.services.items.map((service) => (
              <GuestServiceCard
                key={service.id}
                service={service}
                onPress={() =>
                  navigation.navigate('ServiceDetail', { serviceId: service.id })
                }
              />
            ))}
          </View>
        ) : null}

        {tab === 'Posts' ? (
          <View>
            {profileState.posts.loading ? <GuestStatusBlock loading /> : null}
            {profileState.posts.error ? (
              <GuestStatusBlock
                error={profileState.posts.error}
                onRetry={profileState.refresh}
              />
            ) : null}
            {!profileState.posts.loading &&
            profileState.posts.items.length === 0 &&
            !profileState.posts.error ? (
              <GuestStatusBlock emptyLabel="No public posts yet." />
            ) : null}
            {profileState.posts.items.map((post) => (
              <GuestPostCard
                key={post.id}
                post={post}
                onPress={() =>
                  navigation.navigate('PostDetail', { postId: post.id })
                }
              />
            ))}
          </View>
        ) : null}

        {profileState.reviews.items.length > 0 && tab === 'About' ? (
          <View style={styles.section}>
            <Text style={styles.subhead}>Reviews</Text>
            {profileState.reviews.items.slice(0, 3).map((review) => (
              <GuestReviewCard key={review.id} review={review} />
            ))}
            <TouchableOpacity
              onPress={() => navigation.navigate('Reviews', { userId: profile.id })}
            >
              <Text style={styles.link}>See all reviews</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  cover: { width: '100%', height: 148, backgroundColor: colors.borderLight },
  coverFallback: { backgroundColor: colors.borderLight },
  identity: {
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.lg,
    gap: 4,
  },
  name: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
  meta: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center' },
  bio: { ...typography.body, color: colors.text, marginBottom: spacing.md },
  section: { paddingHorizontal: spacing.screen, paddingVertical: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
  },
  chipText: { ...typography.caption, color: colors.text },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
  },
  subhead: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  link: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
