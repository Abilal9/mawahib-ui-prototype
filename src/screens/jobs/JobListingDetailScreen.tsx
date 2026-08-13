import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Button from '../../components/ui/Button';
import ActionBusyOverlay from '../../components/ui/ActionBusyOverlay';
import ConfirmActionModal from '../../components/ui/ConfirmActionModal';
import SuccessConfirmationModal from '../../components/ui/SuccessConfirmationModal';
import { toImageSource } from '../../utils/image';
import { colors, spacing, radius, typography } from '../../theme';
import { MarketplaceSuccessKey } from '../../utils/marketplaceSuccess';
import { jobService } from '../../services';
import {
  ApiJobListing,
  mapApiListingToJob,
  marketplaceApi,
} from '../../services/marketplaceApi';
import { useUserJobs } from '../../context/UserJobsContext';
import { useAuth } from '../../context/AuthContext';
import { useMarketplaceSuccess } from '../../hooks/useMarketplaceSuccess';
import { ScreenProps } from '../../navigation/types';
import { JobListing } from '../../data/types';
import { ApiError } from '../../lib/apiClient';

export default function JobListingDetailScreen({
  route,
  navigation,
}: ScreenProps<'JobListingDetail'>) {
  const {
    applyToListing,
    archiveListing,
    reopenListing,
    closeListing,
    deleteListing,
    refresh,
  } = useUserJobs();
  const { apiUser } = useAuth();
  const { listingId } = route.params;
  const [job, setJob] = useState<JobListing | undefined>(() =>
    jobService.getByIdSync(listingId),
  );
  const [apiListing, setApiListing] = useState<ApiJobListing | null>(null);
  const [loading, setLoading] = useState(!job);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [ownerActionError, setOwnerActionError] = useState<string | null>(null);
  const [ownerBusy, setOwnerBusy] = useState(false);
  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    danger?: boolean;
    run: () => void;
  } | null>(null);
  const {
    successVisible,
    successTitle,
    successMessage,
    showSuccess,
    completeSuccess,
  } = useMarketplaceSuccess(navigation, refresh);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // The API listing carries posterId + status, which owner actions depend on.
      const next = await marketplaceApi.getListing(listingId);
      setApiListing(next);
      setJob(mapApiListingToJob(next));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setError('Job not found');
      } else {
        setError(e instanceof ApiError ? e.message : 'Failed to load job');
      }
      setApiListing(null);
      setJob(undefined);
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.missingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!job || error) {
    return (
      <ScreenContainer>
        <View style={styles.missingWrap}>
          <Text style={styles.missingText}>{error || 'Job not found'}</Text>
          <TouchableOpacity onPress={() => void load()} style={styles.missingBack}>
            <Text style={styles.missingBackText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.missingBackText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const typeLabel =
    job.type === 'part-time'
      ? 'Part-time'
      : job.type === 'full-time'
        ? 'Full-time'
        : job.type === 'contract'
          ? 'Contract'
          : job.type === 'gig'
            ? 'Gig'
            : 'Freelance';

  const isOwner = Boolean(apiUser && apiListing && apiUser.id === apiListing.posterId);
  /** Any signed-in user may apply; the API rejects applying to your own listing. */
  const canApply = Boolean(apiUser) && !isOwner;

  const runOwnerAction = (
    action: () => Promise<void>,
    successKey: Extract<
      MarketplaceSuccessKey,
      | 'listingArchived'
      | 'listingReopened'
      | 'listingClosed'
      | 'listingDeleted'
    >,
  ) => {
    void (async () => {
      setOwnerBusy(true);
      setOwnerActionError(null);
      try {
        await action();
        showSuccess(successKey);
      } catch (e) {
        setOwnerActionError(
          e instanceof ApiError || e instanceof Error
            ? e.message
            : 'Could not update this listing',
        );
      } finally {
        setOwnerBusy(false);
      }
    })();
  };

  const askOwnerAction = (
    title: string,
    message: string,
    confirmLabel: string,
    action: () => Promise<void>,
    successKey: Extract<
      MarketplaceSuccessKey,
      | 'listingArchived'
      | 'listingReopened'
      | 'listingClosed'
      | 'listingDeleted'
    >,
    danger?: boolean,
  ) => {
    setConfirm({
      title,
      message,
      confirmLabel,
      danger,
      run: () => runOwnerAction(action, successKey),
    });
  };

  const deleteAction = {
    title: 'Delete',
    onPress: () =>
      askOwnerAction(
        'Delete Listing?',
        'This removes the listing and closes any open negotiations on it. Accepted work already in progress is not cancelled.',
        'Delete Listing',
        () => deleteListing(listingId),
        'listingDeleted',
        true,
      ),
  };

  const ownerActions: { title: string; onPress: () => void }[] = isOwner
    ? apiListing?.status === 'open'
      ? [
          {
            title: 'Archive',
            onPress: () =>
              askOwnerAction(
                'Archive Listing?',
                'The listing will be hidden from Explore and open negotiations will be closed. You can reopen later for new applicants.',
                'Archive',
                () => archiveListing(listingId),
                'listingArchived',
              ),
          },
          {
            title: 'Close',
            onPress: () =>
              askOwnerAction(
                'Close Listing?',
                'Closing ends open applications and negotiations on this listing.',
                'Close Listing',
                () => closeListing(listingId),
                'listingClosed',
                true,
              ),
          },
          deleteAction,
        ]
      : apiListing?.status === 'archived'
        ? [
            {
              title: 'Reopen',
              onPress: () =>
                askOwnerAction(
                  'Reopen Listing?',
                  'The listing will become visible again for new applicants.',
                  'Reopen',
                  () => reopenListing(listingId),
                  'listingReopened',
                ),
            },
            {
              title: 'Close',
              onPress: () =>
                askOwnerAction(
                  'Close Listing?',
                  'Closing ends open applications and negotiations on this listing.',
                  'Close Listing',
                  () => closeListing(listingId),
                  'listingClosed',
                  true,
                ),
            },
            deleteAction,
          ]
        : apiListing?.status === 'closed'
          ? [
              {
                title: 'Reopen',
                onPress: () =>
                  askOwnerAction(
                    'Reopen Listing?',
                    'The listing will become visible again for new applicants.',
                    'Reopen',
                    () => reopenListing(listingId),
                    'listingReopened',
                  ),
              },
              deleteAction,
            ]
          : [deleteAction]
    : [];

  return (
    <ScreenContainer padded={false}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            {job.logo ? (
              <Image source={toImageSource(job.logo)} style={styles.logo} contentFit="cover" />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoText}>{job.company.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.heroInfo}>
              <Text style={styles.title}>{job.title}</Text>
              <Text style={styles.company}>{job.company}</Text>
            </View>
          </View>

          <View style={styles.badges}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{typeLabel}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.metaText}>{job.location}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.metaText}>{job.salary}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>About this job</Text>
        <Text style={styles.description}>{job.description}</Text>

        <Text style={styles.sectionTitle}>Required skills</Text>
        <View style={styles.skills}>
          {job.skills.map((skill) => (
            <View key={skill} style={styles.skillTag}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {applyError ? (
          <Text style={styles.applyError}>{applyError}</Text>
        ) : null}
        {ownerActionError ? (
          <Text style={styles.applyError}>{ownerActionError}</Text>
        ) : null}
        {isOwner ? (
          <>
            <Text style={styles.applyHint}>
              You posted this listing · {apiListing?.status.replace(/_/g, ' ')}
            </Text>
            {ownerActions.length > 0 ? (
              <View style={styles.ownerActions}>
                {ownerActions.map((action) => (
                  <Button
                    key={action.title}
                    title={action.title}
                    variant="secondary"
                    style={styles.ownerActionBtn}
                    disabled={ownerBusy}
                    onPress={action.onPress}
                  />
                ))}
              </View>
            ) : null}
          </>
        ) : canApply ? (
          <Button
            title={applying ? 'Applying…' : 'Apply Now'}
            fullWidth
            disabled={applying}
            onPress={() =>
              setConfirm({
                title: 'Apply to Listing?',
                message:
                  'Your application will be sent to the listing owner as a work request.',
                confirmLabel: 'Apply',
                run: () => {
                  void (async () => {
                    setApplying(true);
                    setApplyError(null);
                    try {
                      await applyToListing(job.id);
                      showSuccess('applicationSent');
                    } catch (e) {
                      setApplyError(
                        e instanceof ApiError ? e.message : 'Could not apply',
                      );
                    } finally {
                      setApplying(false);
                    }
                  })();
                },
              })
            }
          />
        ) : (
          <Text style={styles.applyHint}>
            Sign in to apply to this listing.
          </Text>
        )}
      </View>

      <ConfirmActionModal
        visible={Boolean(confirm)}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
        confirmLabel={confirm?.confirmLabel ?? 'Confirm'}
        danger={confirm?.danger}
        busy={applying || ownerBusy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (!confirm) return;
          const pending = confirm;
          setConfirm(null);
          pending.run();
        }}
      />

      <ActionBusyOverlay
        visible={applying || ownerBusy}
        message={applying ? 'Sending application…' : 'Updating listing…'}
      />
      <SuccessConfirmationModal
        visible={successVisible}
        title={successTitle}
        message={successMessage}
        onDone={() => void completeSuccess()}
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
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.h3, color: colors.text },
  content: { paddingHorizontal: spacing.screen, paddingBottom: spacing.xxxl },
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  heroTop: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  logo: { width: 56, height: 56, borderRadius: radius.button },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: radius.button,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { ...typography.h3, color: colors.primary },
  heroInfo: { flex: 1, justifyContent: 'center' },
  title: { ...typography.h2, color: colors.text },
  company: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
  badges: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  typeBadge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.button,
  },
  typeText: { ...typography.caption, color: '#193CB8', fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  metaText: { ...typography.bodySmall, color: colors.textSecondary },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  skillTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: '#FFF0F7',
  },
  skillText: { ...typography.bodySmall, color: colors.primary },
  footer: {
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  applyError: { ...typography.caption, color: colors.error ?? '#DC2626', textAlign: 'center' },
  applyHint: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center' },
  ownerActions: { flexDirection: 'row', gap: spacing.sm },
  ownerActionBtn: { flex: 1 },
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
