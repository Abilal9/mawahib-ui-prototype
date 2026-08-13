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
import CalendarPicker from '../../components/ui/CalendarPicker';
import ActionBusyOverlay from '../../components/ui/ActionBusyOverlay';
import MoneyAmount from '../../components/ui/MoneyAmount';
import MoneyAmountField from '../../components/ui/MoneyAmountField';
import SuccessConfirmationModal from '../../components/ui/SuccessConfirmationModal';
import { colors, spacing, radius, typography } from '../../theme';
import { ApiError } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useMyProfile } from '../../context/ProfileContext';
import {
  PAYMENTS_UNAVAILABLE_MESSAGE,
  useUserJobs,
} from '../../context/UserJobsContext';
import { useMarketplaceSuccess } from '../../hooks/useMarketplaceSuccess';
import { openUserProfile } from '../../utils/openUserProfile';
import { MarketplaceSuccessKey } from '../../utils/marketplaceSuccess';
import { ScreenProps } from '../../navigation/types';
import {
  ApiWorkRequest,
  DEFAULT_CURRENCY,
  DURATION_UNITS,
  DeadlineType,
  DurationUnit,
  ProposedTermsInput,
  SOURCE_BADGE_LABEL,
  WorkRequestDeadlineInput,
  WorkRequestEvent,
  WorkRequestTerms,
  effectiveTerms,
  formatDeadline,
  formatMoney,
  fromIsoDate,
  summarizeTermsChange,
  termsChangeFromPayload,
  termsTotal,
  toIsoDate,
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

const DEADLINE_MODES: { id: DeadlineType; label: string }[] = [
  { id: 'exact_date', label: 'Exact' },
  { id: 'date_range', label: 'Range' },
  { id: 'duration', label: 'Duration' },
  { id: 'flexible', label: 'Flexible' },
];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatPickedDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Groups thousands while the user types, keeping at most two decimals. */
function formatAmountInput(text: string): string {
  const cleaned = text.replace(/[^\d.]/g, '');
  const [whole = '', ...rest] = cleaned.split('.');
  const grouped = whole
    .replace(/^0+(?=\d)/, '')
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (!cleaned.includes('.')) return grouped;
  return `${grouped || '0'}.${rest.join('').slice(0, 2)}`;
}

/** A positive amount, or null when the field is blank or not a real price. */
function parseAmountInput(text: string): number | null {
  const amount = Number(text.replace(/,/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100) / 100;
}

function moneyChanged(
  a: WorkRequestTerms['money'],
  b: WorkRequestTerms['money'],
): boolean {
  if (!a && !b) return false;
  if (!a || !b) return true;
  return a.amount !== b.amount || a.currency !== b.currency;
}

function deadlineChanged(
  a: WorkRequestTerms['deadline'],
  b: WorkRequestTerms['deadline'],
): boolean {
  return formatDeadline(a) !== formatDeadline(b);
}

function TermsBlock({
  terms,
  compareWith,
  variant = 'plain',
}: {
  terms: WorkRequestTerms;
  /** When set, price/deadline diffs against this snapshot are highlighted. */
  compareWith?: WorkRequestTerms | null;
  variant?: 'plain' | 'original' | 'proposed';
}) {
  const addons = terms.addons ?? [];
  const total = termsTotal(terms);
  const showTotal =
    addons.length > 0 && !!total && total.amount !== terms.money?.amount;
  const priceDiff = compareWith
    ? moneyChanged(terms.money, compareWith.money)
    : false;
  const deadlineDiff = compareWith
    ? deadlineChanged(terms.deadline, compareWith.deadline)
    : false;

  return (
    <View
      style={[
        styles.termsCard,
        variant === 'proposed' && styles.proposedTermsCard,
      ]}
    >
      <Row label="Title" value={terms.title || '—'} />
      <MoneyRow
        label="Price"
        money={terms.money}
        fallback="Negotiable"
        struck={variant === 'original' && priceDiff}
        emphasized={variant === 'proposed' && priceDiff}
      />
      <Row
        label="Deadline"
        value={formatDeadline(terms.deadline)}
        struck={variant === 'original' && deadlineDiff}
        emphasized={variant === 'proposed' && deadlineDiff}
      />
      {terms.packageName || terms.packageTier ? (
        <Row
          label="Package"
          value={terms.packageName || terms.packageTier || ''}
        />
      ) : null}
      {addons.map((addon) => (
        <MoneyRow
          key={addon.id || addon.title}
          label={`Add-on · ${addon.title}`}
          money={addon.money}
          fallback="—"
        />
      ))}
      {showTotal ? (
        <MoneyRow label="Total" money={total} fallback="—" />
      ) : null}
      {terms.location ? <Row label="Location" value={terms.location} /> : null}
      {terms.scope ? <Block label="Scope" value={terms.scope} /> : null}
      {terms.notes ? <Block label="Notes" value={terms.notes} /> : null}
    </View>
  );
}

function Row({
  label,
  value,
  struck,
  emphasized,
}: {
  label: string;
  value: string;
  struck?: boolean;
  emphasized?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[
          styles.rowValue,
          struck && styles.struckValue,
          emphasized && styles.emphasizedValue,
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

function MoneyRow({
  label,
  money,
  fallback,
  struck,
  emphasized,
}: {
  label: string;
  money: WorkRequestTerms['money'];
  fallback: string;
  struck?: boolean;
  emphasized?: boolean;
}) {
  const amount = formatMoney(money);
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {amount ? (
        <MoneyAmount
          amount={amount}
          struck={struck}
          emphasized={emphasized}
        />
      ) : (
        <Text style={styles.rowValue}>{fallback}</Text>
      )}
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
    refresh,
    refreshUnread,
  } = useUserJobs();
  const {
    successVisible,
    successTitle,
    successMessage,
    showSuccess,
    completeSuccess,
  } = useMarketplaceSuccess(navigation, refresh);

  const [request, setRequest] = useState<ApiWorkRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [changesOpen, setChangesOpen] = useState(false);
  const [deadlineMode, setDeadlineMode] = useState<DeadlineType>('exact_date');
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [exactDate, setExactDate] = useState<Date | null>(null);
  const [rangeFrom, setRangeFrom] = useState<Date | null>(null);
  const [rangeTo, setRangeTo] = useState<Date | null>(null);
  const [activeRangeField, setActiveRangeField] = useState<'from' | 'to'>(
    'from',
  );
  const [durationValue, setDurationValue] = useState('1');
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('weeks');
  const [amountText, setAmountText] = useState('');
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
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

  /**
   * `successKey` marks the actions that end the negotiation for this viewer: they
   * confirm and hand off to the Jobs inbox instead of refreshing this screen.
   */
  const runAction = async (
    action: () => Promise<unknown>,
    successKey?: MarketplaceSuccessKey,
  ) => {
    setBusy(true);
    try {
      await action();
      if (successKey) {
        showSuccess(successKey);
        return;
      }
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

  /** The one call to action; everything else lives in the secondary row. */
  const primaryAction: {
    title: string;
    run: () => Promise<unknown>;
    successKey?: MarketplaceSuccessKey;
  } | null = canAccept
    ? {
        title: 'Accept',
        run: () => acceptRequest(request.id),
        successKey: 'requestAccepted',
      }
    : canRespondToChanges
      ? {
          title: 'Accept Changes',
          run: () => acceptChanges(request.id),
          successKey: 'changesAccepted',
        }
      : canDeliver
        ? {
            title: 'Mark as delivered',
            run: () => markDelivered(request.workEngagementId!),
          }
        : canComplete
          ? {
              title: 'Mark as completed',
              run: () => markCompleted(request.workEngagementId!),
            }
          : null;

  const hasSecondaryActions =
    canRequestChanges || canRespondToChanges || canReject || canWithdraw;
  const hasFooterActions =
    !!primaryAction || hasSecondaryActions || awaitingPayment;

  const openChanges = () => {
    const money = terms.money;
    setAmountText(money ? formatAmountInput(String(money.amount)) : '');
    setCurrency(money?.currency || DEFAULT_CURRENCY);

    const deadline = terms.deadline;
    const start =
      deadline?.type === 'exact_date' || deadline?.type === 'date_range'
        ? fromIsoDate(deadline.startDate)
        : null;
    const end =
      deadline?.type === 'date_range' ? fromIsoDate(deadline.endDate) : null;

    setDeadlineMode(deadline?.type ?? 'exact_date');
    setExactDate(deadline?.type === 'exact_date' ? start : null);
    setRangeFrom(deadline?.type === 'date_range' ? start : null);
    setRangeTo(end);
    setActiveRangeField('from');
    setDurationValue(
      deadline?.type === 'duration' && deadline.durationValue
        ? String(deadline.durationValue)
        : '1',
    );
    setDurationUnit(
      deadline?.type === 'duration' && deadline.durationUnit
        ? deadline.durationUnit
        : 'weeks',
    );
    const anchor = start ?? new Date();
    setVisibleMonth(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
    setProposalComment('');
    setChangesOpen(true);
  };

  /**
   * Exact mode picks a single day. Range mode fills `from` then `to`; tapping an
   * earlier day restarts the range so `from ≤ to` always holds.
   */
  const onPickDay = (picked: Date) => {
    if (deadlineMode === 'exact_date') {
      setExactDate(picked);
      return;
    }
    if (activeRangeField === 'from' || !rangeFrom) {
      setRangeFrom(picked);
      setRangeTo(null);
      setActiveRangeField('to');
      return;
    }
    if (picked < rangeFrom) {
      setRangeFrom(picked);
      setRangeTo(null);
      setActiveRangeField('to');
      return;
    }
    setRangeTo(picked);
  };

  const proposedDeadline = (): WorkRequestDeadlineInput | null => {
    if (deadlineMode === 'exact_date') {
      return exactDate ? { type: 'exact_date', startDate: toIsoDate(exactDate) } : null;
    }
    if (deadlineMode === 'date_range') {
      if (!rangeFrom || !rangeTo || rangeTo < rangeFrom) return null;
      return {
        type: 'date_range',
        startDate: toIsoDate(rangeFrom),
        endDate: toIsoDate(rangeTo),
      };
    }
    if (deadlineMode === 'duration') {
      const value = Number(durationValue);
      if (!Number.isInteger(value) || value < 1) return null;
      return { type: 'duration', durationValue: value, durationUnit };
    }
    return { type: 'flexible' };
  };

  const proposedAmount = parseAmountInput(amountText);
  const amountReady = amountText.trim().length === 0 || proposedAmount !== null;
  const deadlineReady = proposedDeadline() !== null;

  const submitChanges = () => {
    const deadline = proposedDeadline();
    if (!deadline || !amountReady) return;
    const proposedTerms: ProposedTermsInput = { deadline };
    if (proposedAmount !== null) {
      proposedTerms.money = { amount: proposedAmount, currency };
    }
    setChangesOpen(false);
    void runAction(
      () =>
        requestChanges(
          request.id,
          proposedTerms,
          proposalComment.trim() || undefined,
        ),
      'changesRequested',
    );
  };

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

        <Text style={styles.sectionTitle}>Original terms</Text>
        <TermsBlock
          terms={request.terms}
          compareWith={
            request.status === 'changes_requested'
              ? request.proposedTerms
              : null
          }
          variant={
            request.status === 'changes_requested' ? 'original' : 'plain'
          }
        />

        {request.status === 'changes_requested' && request.proposedTerms ? (
          <>
            <Text style={styles.sectionTitle}>Proposed terms</Text>
            <TermsBlock
              terms={request.proposedTerms}
              compareWith={request.terms}
              variant="proposed"
            />
            {request.proposalComment ? (
              <View style={styles.commentCard}>
                <Text style={styles.rowLabel}>Comment</Text>
                <Text style={styles.blockValue}>{request.proposalComment}</Text>
              </View>
            ) : null}
          </>
        ) : null}

        {request.agreedTerms ? (
          <>
            <Text style={styles.sectionTitle}>Accepted terms</Text>
            <TermsBlock terms={request.agreedTerms} />
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
            request.events.map((event) => {
              const change =
                event.type === 'changes_requested'
                  ? termsChangeFromPayload(event.payload)
                  : null;
              const summary = change ? summarizeTermsChange(change) : '';
              return (
                <View key={event.id} style={styles.eventRow}>
                  <View style={styles.eventDot} />
                  <View style={styles.eventBody}>
                    <Text style={styles.eventTitle}>
                      {EVENT_LABEL[event.type] ?? event.type}
                    </Text>
                    {summary ? (
                      <Text style={styles.eventSummary}>{summary}</Text>
                    ) : null}
                    {event.note ? (
                      <Text style={styles.eventNote}>{event.note}</Text>
                    ) : null}
                    <Text style={styles.eventTime}>
                      {formatDateTime(event.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {hasFooterActions ? (
        <View style={styles.footer}>
          {primaryAction ? (
            <Button
              title={primaryAction.title}
              fullWidth
              disabled={busy}
              onPress={() =>
                void runAction(primaryAction.run, primaryAction.successKey)
              }
            />
          ) : null}

          {hasSecondaryActions ? (
            <View style={styles.secondaryActions}>
              {canRequestChanges ? (
                <Button
                  title="Request Changes"
                  variant="secondary"
                  style={styles.halfBtn}
                  textStyle={styles.requestChangesText}
                  numberOfLines={1}
                  disabled={busy}
                  onPress={openChanges}
                />
              ) : null}
              {canRespondToChanges ? (
                <Button
                  title="Decline Changes"
                  variant="secondary"
                  style={styles.halfBtn}
                  textStyle={styles.requestChangesText}
                  numberOfLines={1}
                  disabled={busy}
                  onPress={() =>
                    void runAction(
                      () => declineChanges(request.id),
                      'changesDeclined',
                    )
                  }
                />
              ) : null}
              {canReject ? (
                <Button
                  title="Reject"
                  variant="secondary"
                  style={styles.rejectHalfBtn}
                  textStyle={styles.rejectBtnText}
                  numberOfLines={1}
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
                  onPress={() =>
                    void runAction(
                      () => withdrawRequest(request.id),
                      'requestWithdrawn',
                    )
                  }
                />
              ) : null}
            </View>
          ) : null}

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
                void runAction(
                  () =>
                    rejectRequest(request.id, rejectReason.trim() || undefined),
                  'requestRejected',
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
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setChangesOpen(false)}
        >
          <Pressable
            style={styles.changesSheet}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <ScrollView
              contentContainerStyle={styles.changesContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalTitle}>Propose changes</Text>

              <Text style={styles.fieldLabel}>Deadline</Text>
              <View style={styles.modeToggle}>
                {DEADLINE_MODES.map((mode) => {
                  const active = deadlineMode === mode.id;
                  return (
                    <TouchableOpacity
                      key={mode.id}
                      style={[styles.modeBtn, active && styles.modeBtnActive]}
                      onPress={() => setDeadlineMode(mode.id)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.modeBtnText,
                          active && styles.modeBtnTextActive,
                        ]}
                      >
                        {mode.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {deadlineMode === 'exact_date' ? (
                <View style={[styles.dateField, styles.dateFieldActive]}>
                  <Text style={styles.dateFieldValue}>
                    {exactDate ? formatPickedDate(exactDate) : 'Select date'}
                  </Text>
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={colors.primary}
                  />
                </View>
              ) : null}

              {deadlineMode === 'date_range' ? (
                <View style={styles.durationRow}>
                  <TouchableOpacity
                    style={[
                      styles.dateField,
                      styles.durationField,
                      activeRangeField === 'from' && styles.dateFieldActive,
                    ]}
                    onPress={() => setActiveRangeField('from')}
                    activeOpacity={0.85}
                  >
                    <View style={styles.durationFieldInner}>
                      <Text style={styles.durationLabel}>From</Text>
                      <Text style={styles.dateFieldValue}>
                        {rangeFrom ? formatPickedDate(rangeFrom) : 'Select'}
                      </Text>
                    </View>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.dateField,
                      styles.durationField,
                      activeRangeField === 'to' && styles.dateFieldActive,
                    ]}
                    onPress={() => setActiveRangeField('to')}
                    activeOpacity={0.85}
                  >
                    <View style={styles.durationFieldInner}>
                      <Text style={styles.durationLabel}>To</Text>
                      <Text style={styles.dateFieldValue}>
                        {rangeTo ? formatPickedDate(rangeTo) : 'Select'}
                      </Text>
                    </View>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              ) : null}

              {deadlineMode === 'exact_date' || deadlineMode === 'date_range' ? (
                <CalendarPicker
                  month={visibleMonth}
                  onMonthChange={setVisibleMonth}
                  onPickDay={onPickDay}
                  mode={deadlineMode === 'date_range' ? 'range' : 'single'}
                  selected={exactDate}
                  rangeStart={rangeFrom}
                  rangeEnd={rangeTo}
                />
              ) : null}

              {deadlineMode === 'duration' ? (
                <View style={styles.durationRow}>
                  <TextInput
                    placeholder="1"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.singleLineInput, styles.durationValueInput]}
                    keyboardType="number-pad"
                    value={durationValue}
                    onChangeText={(text) =>
                      setDurationValue(text.replace(/[^\d]/g, '').slice(0, 4))
                    }
                  />
                  <View style={styles.unitToggle}>
                    {DURATION_UNITS.map((unit) => {
                      const active = durationUnit === unit;
                      return (
                        <TouchableOpacity
                          key={unit}
                          style={[styles.modeBtn, active && styles.modeBtnActive]}
                          onPress={() => setDurationUnit(unit)}
                          activeOpacity={0.85}
                        >
                          <Text
                            style={[
                              styles.modeBtnText,
                              active && styles.modeBtnTextActive,
                            ]}
                          >
                            {unit}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {deadlineMode === 'flexible' ? (
                <Text style={styles.hintText}>
                  No fixed deadline — you agree on timing later.
                </Text>
              ) : null}

              <MoneyAmountField
                label="Price"
                placeholder="0"
                value={amountText}
                onChangeText={(text) => setAmountText(formatAmountInput(text))}
                containerStyle={styles.priceField}
                error={
                  amountText.trim().length > 0 && proposedAmount === null
                    ? 'Enter an amount greater than zero.'
                    : undefined
                }
              />
              {!(amountText.trim().length > 0 && proposedAmount === null) ? (
                <Text style={styles.hintText}>
                  Leave blank to keep the current price.
                </Text>
              ) : null}

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
                disabled={busy || !deadlineReady || !amountReady}
                onPress={submitChanges}
              />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <ActionBusyOverlay visible={busy} message="Updating request…" />

      <SuccessConfirmationModal
        visible={successVisible}
        title={successTitle}
        message={successMessage}
        onDone={() => void completeSuccess()}
      />
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
  proposedTermsCard: {
    borderColor: colors.primaryLight,
    borderWidth: 1.5,
    backgroundColor: colors.primary + '06',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 26,
  },
  rowLabel: { ...typography.caption, color: colors.textSecondary },
  rowValue: {
    ...typography.bodySmall,
    color: colors.text,
    flexShrink: 1,
    textAlign: 'right',
  },
  struckValue: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  emphasizedValue: {
    color: colors.primary,
    fontWeight: '700',
  },
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
  eventSummary: { ...typography.caption, color: colors.text },
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
  secondaryActions: { flexDirection: 'row', gap: spacing.sm },
  halfBtn: { flex: 1, paddingHorizontal: spacing.md },
  requestChangesText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rejectHalfBtn: {
    flex: 1,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.error + '18',
  },
  rejectBtnText: {
    color: colors.error,
    fontWeight: '600',
  },
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
  changesSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.sm,
    maxHeight: '88%',
  },
  changesContent: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  modalTitle: { ...typography.h3, color: colors.text },
  fieldLabel: { ...typography.caption, color: colors.textSecondary },
  hintText: { ...typography.caption, color: colors.textTertiary },
  priceField: { marginBottom: spacing.sm },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.borderLight,
    borderRadius: radius.button,
    padding: 2,
  },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
    borderRadius: radius.button - 2,
  },
  modeBtnActive: { backgroundColor: colors.primary },
  modeBtnText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modeBtnTextActive: { color: colors.white },
  dateField: {
    minHeight: 42,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
  },
  dateFieldActive: { borderColor: colors.primary },
  dateFieldValue: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  durationRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  durationField: { flex: 1 },
  durationFieldInner: { flex: 1, gap: 1 },
  durationLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
  },
  durationValueInput: { width: 72, textAlign: 'center' },
  unitToggle: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.borderLight,
    borderRadius: radius.button,
    padding: 2,
  },
  singleLineInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 42,
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
