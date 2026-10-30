import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import UserAvatar from '../ui/UserAvatar';
import ServiceMediaMosaic from '../explore/ServiceMediaMosaic';
import PostMediaPreview from '../ui/PostMediaPreview';
import MoneyAmount from '../ui/MoneyAmount';
import { colors, spacing, radius, typography } from '../../theme';
import { displayProfileTitle } from '../../constants/profile';
import { toImageSource } from '../../utils/image';
import { getMediaCacheKey } from '../../lib/mediaCacheKey';
import type {
  GuestActorCard,
  GuestExploreService,
  GuestExploreTalent,
  GuestJob,
  GuestPortfolio,
  GuestPost,
  GuestReview,
  GuestReviewAggregate,
} from '../../services/publicApi';

export function publicTimeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.max(0, Math.floor(ms / 60000));
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

export function guestLocationLabel(
  city: string | null | undefined,
  country: string | null | undefined,
): string | null {
  const parts = [city?.trim(), country?.trim()].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

export function accountTypeLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value === 'talent') return 'Talent';
  if (value === 'business') return 'Business';
  return value;
}

export function guestMediaUrls(
  media: Array<{ url: string; position: number }> | string[] | undefined,
): string[] {
  if (!media || media.length === 0) return [];
  if (typeof media[0] === 'string') return media as string[];
  return [...(media as Array<{ url: string; position: number }>)]
    .sort((a, b) => a.position - b.position)
    .map((item) => item.url)
    .filter(Boolean);
}

export function GuestRating({
  summary,
}: {
  summary: GuestReviewAggregate | undefined;
}) {
  const count = summary?.count ?? 0;
  const average = summary?.average ?? null;
  if (count <= 0 || average == null) {
    return <Text style={styles.muted}>No reviews yet</Text>;
  }
  return (
    <View style={styles.ratingRow}>
      <Ionicons name="star" size={12} color={colors.warning} />
      <Text style={styles.ratingText}>{average.toFixed(1)}</Text>
      <Text style={styles.muted}>({count})</Text>
    </View>
  );
}

export function GuestSectionHeader({
  title,
  onPress,
}: {
  title: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onPress ? (
        <TouchableOpacity onPress={onPress} hitSlop={8} accessibilityRole="button">
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function GuestStatusBlock({
  loading,
  error,
  emptyLabel,
  onRetry,
}: {
  loading?: boolean;
  error?: string | null;
  emptyLabel?: string;
  onRetry?: () => void;
}) {
  if (loading) {
    return (
      <View style={styles.status}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.status}>
        <Text style={styles.statusText}>{error}</Text>
        {onRetry ? (
          <TouchableOpacity onPress={onRetry} accessibilityRole="button">
            <Text style={styles.retry}>Retry</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }
  if (emptyLabel) {
    return (
      <View style={styles.status}>
        <Text style={styles.statusText}>{emptyLabel}</Text>
      </View>
    );
  }
  return null;
}

export function GuestTalentCard({
  talent,
  onPress,
  compact,
}: {
  talent: GuestExploreTalent;
  onPress: () => void;
  compact?: boolean;
}) {
  const location = guestLocationLabel(talent.locationCity, talent.locationCountry);
  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.compactCard]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <UserAvatar uri={talent.avatarUrl} size={compact ? 48 : 56} />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {talent.displayName}
        </Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {displayProfileTitle(talent.title)}
        </Text>
        {accountTypeLabel(talent.accountType) ? (
          <Text style={styles.cardMeta}>{accountTypeLabel(talent.accountType)}</Text>
        ) : null}
        <GuestRating summary={talent.reviewSummary?.overall} />
        {location ? (
          <Text style={styles.cardMeta} numberOfLines={1}>
            {location}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export function GuestServiceCard({
  service,
  onPress,
  onProviderPress,
  compact,
}: {
  service: GuestExploreService | { id: string; title: string; description: string; category: string | null; images: string[]; reviewSummary: GuestReviewAggregate; provider: GuestActorCard };
  onPress: () => void;
  onProviderPress?: () => void;
  compact?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.serviceCard, compact && styles.compactServiceCard]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <ServiceMediaMosaic images={service.images ?? []} />
      <View style={styles.serviceBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {service.title}
        </Text>
        {service.category ? (
          <Text style={styles.cardMeta}>{service.category}</Text>
        ) : null}
        <TouchableOpacity
          style={styles.providerRow}
          onPress={onProviderPress}
          disabled={!onProviderPress}
          activeOpacity={0.85}
        >
          <UserAvatar uri={service.provider.avatarUrl} size={20} />
          <Text style={styles.providerName} numberOfLines={1}>
            {service.provider.displayName}
          </Text>
        </TouchableOpacity>
        <GuestRating summary={service.reviewSummary} />
      </View>
    </TouchableOpacity>
  );
}

function jobTypeLabel(type: string): string {
  if (type === 'part-time') return 'Part-time';
  if (type === 'full-time') return 'Full-time';
  if (type === 'gig') return 'Gig';
  if (type === 'freelance') return 'Freelance';
  if (type === 'contract') return 'Contract';
  return type;
}

export function GuestJobCard({
  job,
  onPress,
  compact,
}: {
  job: GuestJob;
  onPress: () => void;
  compact?: boolean;
}) {
  const company = job.companyName || job.poster.displayName;
  const pay = job.salaryLabel?.trim() || null;
  return (
    <TouchableOpacity
      style={[styles.jobCard, compact && styles.compactCard]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <UserAvatar uri={job.poster.avatarUrl} size={48} />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {job.title}
        </Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {company}
        </Text>
        {job.location ? (
          <Text style={styles.cardMeta} numberOfLines={1}>
            {job.location}
          </Text>
        ) : null}
        {pay ? (
          <MoneyAmount amount={pay} currency={job.currency} size={14} rawLabel />
        ) : job.fixedAmount != null ? (
          <MoneyAmount amount={job.fixedAmount} currency={job.currency} size={14} />
        ) : null}
        <Text style={styles.badge}>{jobTypeLabel(job.employmentType)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function GuestPostCard({
  post,
  onPress,
  onAuthorPress,
}: {
  post: GuestPost;
  onPress: () => void;
  onAuthorPress?: () => void;
}) {
  const images = guestMediaUrls(post.media);
  const caption = post.text.length > 120 ? `${post.text.slice(0, 120)}...` : post.text;
  return (
    <TouchableOpacity style={styles.postCard} onPress={onPress} activeOpacity={0.95}>
      <TouchableOpacity
        style={styles.postHeader}
        onPress={onAuthorPress}
        disabled={!onAuthorPress}
        activeOpacity={0.85}
      >
        <UserAvatar uri={post.author.avatarUrl} size={40} />
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{post.author.displayName}</Text>
          <Text style={styles.cardMeta}>
            {displayProfileTitle(post.author.title)} · {publicTimeAgo(post.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      {images.length > 0 ? <PostMediaPreview images={images} onPress={onPress} /> : null}
      <View style={styles.countRow}>
        <View style={styles.count}>
          <Ionicons name="thumbs-up-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.muted}>{post.likeCount}</Text>
        </View>
        <View style={styles.count}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.muted}>{post.commentCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function GuestReviewCard({ review }: { review: GuestReview }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.postHeader}>
        <UserAvatar uri={review.reviewer.avatarUrl} size={36} />
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{review.reviewer.displayName}</Text>
          <Text style={styles.cardMeta}>{publicTimeAgo(review.createdAt)}</Text>
        </View>
        <GuestRating summary={{ average: review.rating, count: 1 }} />
      </View>
      {review.text ? <Text style={styles.caption}>{review.text}</Text> : null}
      {review.media[0]?.url ? (
        <Image
          source={toImageSource(review.media[0].url)}
          style={styles.reviewImage}
          contentFit="cover"
          recyclingKey={getMediaCacheKey(review.media[0].url) ?? review.media[0].url}
        />
      ) : null}
    </View>
  );
}

export function GuestPortfolioCard({
  project,
  onPress,
}: {
  project: GuestPortfolio;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.portfolioCard} onPress={onPress} activeOpacity={0.9}>
      {project.images[0] ? (
        <Image
          source={toImageSource(project.images[0])}
          style={styles.portfolioImage}
          contentFit="cover"
          recyclingKey={getMediaCacheKey(project.images[0]) ?? project.images[0]}
        />
      ) : (
        <View style={[styles.portfolioImage, styles.portfolioFallback]} />
      )}
      <Text style={styles.cardTitle} numberOfLines={2}>
        {project.title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionTitle: { ...typography.h3, color: colors.text },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginHorizontal: spacing.screen,
    marginBottom: spacing.sm,
  },
  compactCard: {
    width: 260,
    marginHorizontal: 0,
    marginRight: spacing.sm,
  },
  cardBody: { flex: 1, minWidth: 0, gap: 2 },
  cardTitle: { ...typography.label, color: colors.text },
  cardMeta: { ...typography.caption, color: colors.textSecondary },
  muted: { ...typography.caption, color: colors.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { ...typography.caption, color: colors.text, fontWeight: '600' },
  serviceCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    marginHorizontal: spacing.screen,
    marginBottom: spacing.sm,
  },
  compactServiceCard: {
    width: 260,
    marginHorizontal: 0,
    marginRight: spacing.sm,
  },
  serviceBody: { padding: spacing.md, gap: 4 },
  providerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  providerName: { ...typography.bodySmall, color: colors.text, flex: 1 },
  jobCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginHorizontal: spacing.screen,
    marginBottom: spacing.sm,
  },
  badge: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  postCard: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: spacing.md,
    marginBottom: spacing.sm,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
  },
  caption: {
    ...typography.bodySmall,
    color: colors.text,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
  },
  countRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
  },
  count: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingBottom: spacing.md,
    marginHorizontal: spacing.screen,
    marginBottom: spacing.sm,
  },
  reviewImage: {
    height: 160,
    marginHorizontal: spacing.screen,
    marginTop: spacing.sm,
    borderRadius: radius.card,
  },
  portfolioCard: {
    width: '48%',
    marginBottom: spacing.md,
  },
  portfolioImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.card,
    marginBottom: spacing.sm,
    backgroundColor: colors.borderLight,
  },
  portfolioFallback: { backgroundColor: colors.borderLight },
  status: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retry: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
});
