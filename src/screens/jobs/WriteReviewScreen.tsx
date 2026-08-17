import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Button from '../../components/ui/Button';
import { colors, spacing, radius, typography } from '../../theme';
import { toImageSource } from '../../utils/image';
import { useUserJobs } from '../../context/UserJobsContext';
import { useMyProfile } from '../../context/ProfileContext';
import { openUserProfile } from '../../utils/openUserProfile';
import { ApiError } from '../../lib/apiClient';
import { marketplaceApi } from '../../services/marketplaceApi';
import { ScreenProps } from '../../navigation/types';

const MAX_IMAGES = 6;

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1542744094-24638eff58bb?w=400&h=400&fit=crop',
];

export default function WriteReviewScreen({
  route,
  navigation,
}: ScreenProps<'WriteReview'>) {
  const { getJobById, refresh } = useUserJobs();
  const { user: me } = useMyProfile();
  const job =
    getJobById(route.params.jobId) ??
    (route.params.workRequestId
      ? getJobById(route.params.workRequestId)
      : undefined);

  const engagementId = route.params.engagementId ?? job?.engagementId;
  const canSubmit = Boolean(engagementId);

  const initial =
    route.params.initialRating ?? job?.rating ?? 0;

  const [rating, setRating] = useState(initial);
  const [text, setText] = useState(job?.reviewText ?? '');
  const [images, setImages] = useState<string[]>(job?.reviewImages ?? []);
  const [focused, setFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setRating(initial);
  }, [initial]);

  const titleLabel = useMemo(
    () => job?.title ?? 'Completed work',
    [job?.title],
  );

  if (!job && !engagementId) {
    return (
      <ScreenContainer>
        <View style={styles.missingWrap}>
          <Text style={styles.missingText}>Job not found</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.missingBack}
          >
            <Text style={styles.missingBackText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const addImage = () => {
    if (images.length >= MAX_IMAGES) return;
    const next = SAMPLE_IMAGES[images.length % SAMPLE_IMAGES.length];
    setImages((prev) => [...prev, next]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async () => {
    if (!engagementId || submitting) return;
    if (rating < 1 || rating > 5) {
      Alert.alert('Rating required', 'Please choose a star rating.');
      return;
    }
    setSubmitting(true);
    try {
      await marketplaceApi.createEngagementReview(engagementId, {
        rating,
        body: text.trim() || undefined,
      });
      void refresh();
      Alert.alert('Review submitted', 'Thanks for your feedback.', [
        {
          text: 'OK',
          onPress: () => {
            if (route.params.conversationId) {
              navigation.navigate('ArchivedConversations');
            } else {
              navigation.goBack();
            }
          },
        },
      ]);
    } catch (e) {
      Alert.alert(
        'Could not submit review',
        e instanceof ApiError || e instanceof Error
          ? e.message
          : 'Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer padded={false} backgroundColor={colors.white}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Write your review</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!canSubmit ? (
            <View style={styles.deferredBanner}>
              <Text style={styles.deferredTitle}>Coming in a later phase</Text>
              <Text style={styles.deferredBody}>
                Reviews are not available yet for this job. You can preview this
                screen, but nothing will be submitted.
              </Text>
            </View>
          ) : null}

          {job ? (
            <TouchableOpacity
              style={styles.personCard}
              onPress={() =>
                openUserProfile(navigation, job.counterpart.id, me.id)
              }
              activeOpacity={0.85}
            >
              <Image
                source={toImageSource(job.counterpart.avatar)}
                style={styles.avatar}
                contentFit="cover"
              />
              <View style={styles.personMeta}>
                <Text style={styles.personName}>{job.counterpart.name}</Text>
                <Text style={styles.jobTitle} numberOfLines={2}>
                  {job.title}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.personCard}>
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="briefcase-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.personMeta}>
                <Text style={styles.personName}>Rate this job</Text>
                <Text style={styles.jobTitle} numberOfLines={2}>
                  {titleLabel}
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.sectionLabel}>Your rating</Text>
          <View style={styles.starsRow}>
            {Array.from({ length: 5 }).map((_, i) => {
              const value = i + 1;
              const filled = rating >= value;
              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => setRating(value)}
                  activeOpacity={0.75}
                  hitSlop={6}
                >
                  <Ionicons
                    name="star"
                    size={36}
                    color={filled ? colors.warning : colors.border}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Write your review</Text>
          <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
            <TextInput
              style={styles.input}
              placeholder="Share details about your experience..."
              placeholderTextColor={colors.textSecondary}
              multiline
              textAlignVertical="top"
              value={text}
              onChangeText={setText}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              maxLength={500}
            />
          </View>
          <Text style={styles.charCount}>{text.length}/500</Text>

          <View style={styles.photosHeader}>
            <Text style={styles.sectionLabelInline}>Add photos</Text>
            <Text style={styles.optionalHint}>
              Optional · {images.length}/{MAX_IMAGES}
            </Text>
          </View>
          <Text style={styles.photosHint}>
            Optionally attach photos of the completed work.
          </Text>
          <View style={styles.mediaGrid}>
            {images.map((uri, i) => (
              <View key={`${uri}-${i}`} style={styles.mediaSlot}>
                <Image
                  source={{ uri }}
                  style={styles.mediaImage}
                  contentFit="cover"
                />
                <TouchableOpacity
                  style={styles.removeMedia}
                  onPress={() => removeImage(i)}
                  hitSlop={6}
                >
                  <Ionicons name="close-circle" size={22} color={colors.white} />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < MAX_IMAGES ? (
              <TouchableOpacity
                style={styles.addMedia}
                onPress={addImage}
                activeOpacity={0.8}
              >
                <Ionicons name="images-outline" size={26} color={colors.primary} />
                <Text style={styles.addMediaText}>Add</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {canSubmit ? (
            <Button
              title={submitting ? 'Submitting…' : 'Submit review'}
              fullWidth
              disabled={submitting || rating < 1}
              onPress={() => void onSubmit()}
            />
          ) : (
            <Button
              title="Reviews coming later"
              fullWidth
              disabled
              onPress={() => undefined}
            />
          )}
          {submitting ? (
            <ActivityIndicator
              style={styles.footerSpinner}
              color={colors.primary}
            />
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  deferredBanner: {
    backgroundColor: '#FEF9C3',
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  deferredTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: '#8A6A16',
  },
  deferredBody: {
    ...typography.caption,
    color: '#8A6A16',
    lineHeight: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...typography.h3, color: colors.text },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.borderLight,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  personMeta: { flex: 1, gap: 4 },
  personName: { ...typography.label, color: colors.text },
  jobTitle: { ...typography.bodySmall, color: colors.textSecondary },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    backgroundColor: colors.background,
    minHeight: 120,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputWrapFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  input: {
    ...typography.body,
    color: colors.text,
    minHeight: 100,
    padding: 0,
  },
  charCount: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  photosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sectionLabelInline: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  optionalHint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  photosHint: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  mediaSlot: {
    width: '31%',
    aspectRatio: 1,
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    borderRadius: radius.button,
    backgroundColor: colors.borderLight,
  },
  removeMedia: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  addMedia: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addMediaText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  footerSpinner: { marginTop: spacing.sm },
  missingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  missingText: { ...typography.body, color: colors.text, textAlign: 'center' },
  missingBack: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
  },
  missingBackText: { ...typography.button, color: colors.white },
});
