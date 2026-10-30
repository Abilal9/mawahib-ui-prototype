import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import GuestScreenHeader from '../../components/guest/GuestScreenHeader';
import {
  GuestReviewCard,
  GuestStatusBlock,
} from '../../components/guest/GuestDiscoveryCards';
import { useGuestReviews } from '../../hooks/useGuestReviews';
import { colors, spacing } from '../../theme';
import type { SignedOutScreenProps } from '../../navigation/types';

/** Public published reviews only. No authenticated review viewer APIs. */
export default function GuestReviewsScreen({
  route,
  navigation,
}: SignedOutScreenProps<'Reviews'>) {
  const reviews = useGuestReviews({
    userId: route.params?.userId,
    serviceId: route.params?.serviceId,
  });

  return (
    <ScreenContainer padded={false} safeTop={false} backgroundColor={colors.background}>
      <StatusBar style="dark" />
      <GuestScreenHeader onBack={() => navigation.goBack()} title="Reviews" />
      {reviews.loading ? (
        <GuestStatusBlock loading />
      ) : reviews.notFound ? (
        <GuestStatusBlock error="Reviews are unavailable." />
      ) : (
        <FlatList
          data={reviews.items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (reviews.hasMore && !reviews.loadingMore) void reviews.loadMore();
          }}
          ListEmptyComponent={
            <GuestStatusBlock
              error={reviews.error}
              emptyLabel={reviews.error ? undefined : 'No published reviews yet.'}
              onRetry={reviews.error ? reviews.refresh : undefined}
            />
          }
          ListFooterComponent={
            reviews.loadingMore ? <GuestStatusBlock loading /> : undefined
          }
          renderItem={({ item }) => <GuestReviewCard review={item} />}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { paddingTop: spacing.sm, paddingBottom: spacing.xxxl },
});
