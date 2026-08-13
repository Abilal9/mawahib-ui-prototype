import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Button from '../../components/ui/Button';
import { colors, spacing, radius, typography } from '../../theme';
import { ApiError } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useMyProfile } from '../../context/ProfileContext';
import {
  PAYMENTS_UNAVAILABLE_MESSAGE,
  useUserJobs,
} from '../../context/UserJobsContext';
import { openUserProfile } from '../../utils/openUserProfile';
import { ScreenProps } from '../../navigation/types';
import {
  ApiWorkRequest,
  SOURCE_BADGE_LABEL,
  WorkRequestEvent,
  WorkRequestTerms,
  effectiveTerms,
  workRequestApi,
} from '../../services/workRequestApi';

const STATUS_TONE: Record<
  ApiWorkRequest['status'],
  { bg: string; text: string }
> = {
  pending: { bg: '#FCE7F3', text: '#BE185D' },
  changes_requested: { bg: '#FEF9C3', text: '#8A6A16' },
  pending_payment: { bg: '#E0ECFF', text: '#2E6AC5' },
  rejected: { bg: '#FEE2E2', text: '#B91C1C' },
  withdrawn: { bg: '#EEF2F6', text: '#627D98' },
};

const STATUS_LABEL: Record<ApiWorkRequest['status'], string> = {
  pending: 'Pending',
  changes_requested: 'Changes Requested',
  pending_payment: 'Awaiting Payment',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

const EVENT_LABEL: Record<WorkRequestEvent['type'], string> = {
  created: 'Request sent',
  changes_requested: 'Changes requested',
  changes_accepted: 'Changes accepted',
  changes_declined: 'Changes declined',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  viewed: 'Viewed',
  listing_closed: 'Listing closed',
  note: 'Note',
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function priceText(terms: WorkRequestTerms) {
  if (!terms.price) return 'Negotiable';
  return terms.currency && !terms.price.includes(terms.currency)
    ? `${terms.currency} ${terms.price}`
    : terms.price;
}

function TermsBlock({ terms }: { terms: WorkRequestTerms }) {
  return (
    <View style={styles.termsCard}>
      <Row label="Title" value={terms.title || '—'} />
      <Row label="Price" value={priceText(terms)} />
      <Row label="Deadline" value={terms.deadlineLabel || 'Flexible'} />
      {terms.packageName || terms.packageTier ? (
        <Row label="Package" value={terms.packageName || terms.packageTier || ''} />
      ) : null}
      {terms.addons && terms.addons.length > 0 ? (
        <Row
          label="Add-ons"
          value={terms.addons.map((a) => a.title).join(', ')}
        />
      ) : null}
      {terms.scope ? <Block label="Scope" value={terms.scope} /> : null}
      {terms.notes ? <Block label="Notes" value={terms.notes} /> : null}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function Block({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.block}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.blockValue}>{value}</Text>
    </View>
  );
}

export default function WorkRequestDetailScreen({
  route,
  navigation,
}: ScreenProps<'WorkRequestDetail'>) {
  const { requestId } = route.params;
  const { apiUser } = useAuth();
  const { user: me } = useMyProfile();
  const {
    acceptRequest,
    requestChanges,
    acceptChanges,
    declineChanges,
    rejectRequest,
    withdrawRequest,
    markDelivered,
    markCompleted,
    refreshUnread,
  } = useUserJobs();

  const [request, setRequest] = useState<ApiWorkRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [changesOpen, setChangesOpen] = useState(false);
  const [proposedPrice, setProposedPrice] = useState('');
  const [proposedDeadline, setProposedDeadline] = useState('');
  const [proposalComment, setProposalComment] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetched = await workRequestApi.get(requestId);
      setRequest(fetched);
      // Marking read does not bump updatedAt, so the counterparty is unaffected.
      const viewed = await workRequestApi
        .markViewed(requestId)
        .catch(() => null);
      if (viewed) setRequest(viewed);
      await refreshUnread();
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : 'Failed to load this request',
      );
      setRequest(null);
    } finally {
      setLoading(false);
    }
  }, [requestId, refreshUnread]);

  useEffect(() => {
    void load();
  }, [load]);

  const terms = useMemo(
    () => (request ? effectiveTerms(request) : null),
    [request],
  );

  const runAction = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
      const fresh = await workRequestApi.get(requestId);
      setRequest(fresh);
      await refreshUnread();
    } catch (e) {
      Alert.alert(
        'Could not update request',
        e instanceof ApiError || e instanceof Error
          ? e.message
          : 'Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!request || !terms) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <Text style={styles.missingText}>{error || 'Request not found'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void load()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.linkText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const viewerId = apiUser?.id ?? me.id;
  const isSender = request.senderUserId === viewerId;
  const isRecipient = request.recipientUserId === viewerId;
  const isClient = request.clientUserId === viewerId;
  const isProvider = request.providerUserId === viewerId;
  const tone = STATUS_TONE[request.status];

  const canAccept = isRecipient && request.status === 'pending';
  const canRequestChanges = isRecipient && request.status === 'pending';
  const canReject =
    isRecipient &&
    (request.status === 'pending' || request.status === 'changes_requested');
  const canRespondToChanges = isSender && request.status === 'changes_requested';
  const canWithdraw =
    isSender &&
    (request.status === 'pending' || request.status === 'changes_requested');
  const awaitingPayment =
    request.status === 'pending_payment' &&
    (request.workEngagementStatus === 'pending_payment' ||
      request.workEngagementStatus === null);
  const canDeliver =
    isProvider && request.workEngagementStatus === 'in_progress';
  const canComplete =
    isClient && request.workEngagementStatus === 'delivered';

  const openChanges = () => {
    setProposedPrice(terms.price);
    setProposedDeadline(terms.deadlineLabel);
    setProposalComment('');
    setChangesOpen(true);
  };

  const hasFooterActions =
    canAccept ||
    canReject ||
    canRespondToChanges ||
    canWithdraw ||
    canDeliver ||
    canComplete ||
    awaitingPayment;

  return (
    <ScreenContainer padded={false} backgroundColor={colors.white}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {terms.title || request.title}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
          <Text style={[styles.statusPillText, { color: tone.text }]}>
            {STATUS_LABEL[request.status]}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.badgeRow}>
          <View style={styles.sourceBadge}>
            <Text style={styles.sourceBadgeText}>
              {SOURCE_BADGE_LABEL[request.source]}
            </Text>
          </View>
          <Text style={styles.directionText}>
            {isSender ? 'You sent this' : 'Sent to you'}
          </Text>
        </View>

        <View style={styles.partiesCard}>
          <PartyRow
            label="From"
            name={request.sender.displayName}
            hint={request.senderUserId === viewerId ? 'You' : undefined}
            onPress={() =>
              openUserProfile(navigation, request.senderUserId, me.id)
            }
          />
          <PartyRow
            label="To"
            name={request.recipient.displayName}
            hint={request.recipientUserId === viewerId ? 'You' : undefined}
            onPress={() =>
              openUserProfile(navigation, request.recipientUserId, me.id)
            }
          />
          <View style={styles.rolesRow}>
            <Text style={styles.rolesText}>
              Client:{' '}
              {isClient
                ? 'You'
                : request.clientUserId === request.senderUserId
                  ? request.sender.displayName
                  : request.recipient.displayName}
            </Text>
            <Text style={styles.rolesText}>
              Provider:{' '}
              {isProvider
                ? 'You'
                : request.providerUserId === request.senderUserId
                  ? request.sender.displayName
                  : request.recipient.displayName}
            </Text>
          </View>
          <Text style={styles.timestamp}>
            Requested {formatDateTime(request.createdAt)}
          </Text>
        </View>

        {request.jobListingId ? (
          <TouchableOpacity
            style={styles.listingLink}
            onPress={() =>
              navigation.navigate('JobListingDetail', {
                listingId: request.jobListingId!,
              })
            }
            activeOpacity={0.8}
          >
            <Ionicons name="briefcase-outline" size={18} color={colors.primary} />
            <Text style={styles.listingLinkText}>View job posting</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        ) : null}

        <Text style={styles.sectionTitle}>
          {request.agreedTerms ? 'Agreed terms' : 'Terms'}
        </Text>
        <TermsBlock terms={request.agreedTerms ?? request.terms} />

        {request.status === 'changes_requested' && request.proposedTerms ? (
          <>
            <Text style={styles.sectionTitle}>Proposed changes</Text>
            <TermsBlock terms={request.proposedTerms} />
            {request.proposalComment ? (
              <View style={styles.commentCard}>
                <Text style={styles.rowLabel}>Comment</Text>
                <Text style={styles.blockValue}>{request.proposalComment}</Text>
              </View>
            ) : null}
          </>
        ) : null}

        {request.rejectionComment ? (
          <View style={[styles.commentCard, styles.rejectionCard]}>
            <Text style={styles.rowLabel}>Reason</Text>
            <Text style={styles.blockValue}>{request.rejectionComment}</Text>
          </View>
        ) : null}

        {awaitingPayment ? (
          <View style={styles.noticeCard}>
            <Ionicons name="time-outline" size={18} color="#2E6AC5" />
            <Text style={styles.noticeText}>
              {isClient
                ? 'Awaiting payment — payments are coming in a later phase.'
                : 'Waiting for payment from the client.'}
            </Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>History</Text>
        <View style={styles.termsCard}>
          {request.events.length === 0 ? (
            <Text style={styles.rowValue}>No activity yet.</Text>
          ) : (
            request.events.map((event) => (
              <View key={event.id} style={styles.eventRow}>
                <View style={styles.eventDot} />
                <View style={styles.eventBody}>
                  <Text style={styles.eventTitle}>
                    {EVENT_LABEL[event.type] ?? event.type}
                  </Text>
                  {event.note ? (
                    <Text style={styles.eventNote}>{event.note}</Text>
                  ) : null}
                  <Text style={styles.eventTime}>
                    {formatDateTime(event.createdAt)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {hasFooterActions ? (
        <View style={styles.footer}>
          {canAccept ? (
            <Button
              title="Accept"
              fullWidth
              disabled={busy}
              onPress={() => void runAction(() => acceptRequest(request.id))}
            />
          ) : null}
          {canRespondToChanges ? (
            <Button
              title="Accept Changes"
              fullWidth
              disabled={busy}
              onPress={() => void runAction(() => acceptChanges(request.id))}
            />
          ) : null}
          {canDeliver ? (
            <Button
              title="Mark as delivered"
              fullWidth
              disabled={busy}
              onPress={() =>
                void runAction(() => markDelivered(request.workEngagementId!))
              }
            />
          ) : null}
          {canComplete ? (
            <Button
              title="Mark as completed"
              fullWidth
              disabled={busy}
              onPress={() =>
                void runAction(() => markCompleted(request.workEngagementId!))
              }
            />
          ) : null}

          <View style={styles.secondaryRow}>
            {canRequestChanges ? (
              <Button
                title="Request Changes"
                variant="secondary"
                style={styles.halfBtn}
                disabled={busy}
                onPress={openChanges}
              />
            ) : null}
            {canRespondToChanges ? (
              <Button
                title="Decline Changes"
                variant="secondary"
                style={styles.halfBtn}
                disabled={busy}
                onPress={() =>
                  void runAction(() => declineChanges(request.id))
                }
              />
            ) : null}
            {canReject ? (
              <Button
                title="Reject"
                variant="secondary"
                style={styles.halfBtn}
                disabled={busy}
                onPress={() => {
                  setRejectReason('');
                  setRejectOpen(true);
                }}
              />
            ) : null}
            {canWithdraw ? (
              <Button
                title="Withdraw"
                variant="secondary"
                style={styles.halfBtn}
                disabled={busy}
                onPress={() => void runAction(() => withdrawRequest(request.id))}
              />
            ) : null}
          </View>

          {awaitingPayment && isClient ? (
            <Text style={styles.footerHint}>{PAYMENTS_UNAVAILABLE_MESSAGE}</Text>
          ) : null}
        </View>
      ) : null}

      <Modal
        visible={rejectOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setRejectOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Reject request</Text>
            <TextInput
              placeholder="Optional reason…"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              multiline
              value={rejectReason}
              onChangeText={setRejectReason}
            />
            <Button
              title="Confirm Reject"
              fullWidth
              style={styles.dangerBtn}
              disabled={busy}
              onPress={() => {
                setRejectOpen(false);
                void runAction(() =>
                  rejectRequest(request.id, rejectReason.trim() || undefined),
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={changesOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setChangesOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setChangesOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Propose changes</Text>
            <Text style={styles.fieldLabel}>Price</Text>
            <TextInput
              placeholder="e.g. SAR 9,000 project"
              placeholderTextColor={colors.textSecondary}
              style={styles.singleLineInput}
              value={proposedPrice}
              onChangeText={setProposedPrice}
            />
            <Text style={styles.fieldLabel}>Deadline</Text>
            <TextInput
              placeholder="e.g. 3 weeks, or 05/14/2026"
              placeholderTextColor={colors.textSecondary}
              style={styles.singleLineInput}
              value={proposedDeadline}
              onChangeText={setProposedDeadline}
            />
            <Text style={styles.fieldLabel}>Comment (optional)</Text>
            <TextInput
              placeholder="Explain what you changed…"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              multiline
              value={proposalComment}
              onChangeText={setProposalComment}
            />
            <Button
              title="Send Changes"
              fullWidth
              disabled={
                busy ||
                (!proposedPrice.trim() && !proposedDeadline.trim())
              }
              onPress={() => {
                setChangesOpen(false);
                void runAction(() =>
                  requestChanges(
                    request.id,
                    {
                      price: proposedPrice.trim() || undefined,
                      deadlineLabel: proposedDeadline.trim() || undefined,
                    },
                    proposalComment.trim() || undefined,
                  ),
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

function PartyRow({
  label,
  name,
  hint,
  onPress,
}: {
  label: string;
  name: string;
  hint?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.partyValue}>
        <Ionicons
          name="person-circle-outline"
          size={20}
          color={colors.textSecondary}
        />
        <Text style={styles.rowValue}>{hint ? `${name} (${hint})` : name}</Text>
      </View>
    </TouchableOpacity>
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
    gap: spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...typography.h3, color: colors.text, flex: 1 },
  statusPill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.button,
  },
  statusPillText: { ...typography.caption, fontWeight: '500' },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sourceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: '#EEF2F6',
  },
  sourceBadgeText: {
    ...typography.caption,
    fontSize: 10,
    letterSpacing: 0.6,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  directionText: { ...typography.caption, color: colors.textSecondary },
  partiesCard: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  rolesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  rolesText: { ...typography.caption, color: colors.textSecondary },
  timestamp: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  listingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  listingLinkText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
    flex: 1,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  termsCard: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 26,
  },
  rowLabel: { ...typography.caption, color: colors.textSecondary },
  rowValue: { ...typography.bodySmall, color: colors.text, flexShrink: 1, textAlign: 'right' },
  partyValue: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  block: { gap: 2, paddingTop: spacing.xs },
  blockValue: { ...typography.bodySmall, color: colors.text, lineHeight: 20 },
  commentCard: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.card,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: 2,
  },
  rejectionCard: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#E0ECFF',
    borderRadius: radius.card,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  noticeText: { ...typography.bodySmall, color: '#2E6AC5', flex: 1 },
  eventRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.xs },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  eventBody: { flex: 1, gap: 1 },
  eventTitle: { ...typography.bodySmall, color: colors.text, fontWeight: '600' },
  eventNote: { ...typography.caption, color: colors.textSecondary },
  eventTime: { ...typography.caption, color: colors.textSecondary },
  footer: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  secondaryRow: { flexDirection: 'row', gap: spacing.sm },
  halfBtn: { flex: 1 },
  footerHint: { ...typography.caption, color: colors.textSecondary },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.screen,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  modalTitle: { ...typography.h3, color: colors.text },
  fieldLabel: { ...typography.caption, color: colors.textSecondary },
  singleLineInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.bodySmall,
    color: colors.text,
  },
  input: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    padding: spacing.md,
    textAlignVertical: 'top',
    ...typography.bodySmall,
    color: colors.text,
  },
  dangerBtn: { backgroundColor: colors.error },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  missingText: { ...typography.body, color: colors.text, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
  },
  retryText: { ...typography.button, color: colors.white },
  linkText: { ...typography.bodySmall, color: colors.primary },
});
