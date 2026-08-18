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
import ConfirmActionModal from '../../components/ui/ConfirmActionModal';
import MoneyAmountField from '../../components/ui/MoneyAmountField';
import SuccessConfirmationModal from '../../components/ui/SuccessConfirmationModal';
import { colors, spacing, radius, typography } from '../../theme';
import {
  attachmentIcon,
  parseAttachmentsFromNotes,
} from '../../utils/workRequestAttachments';
import { ApiError } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useMyProfile } from '../../context/ProfileContext';
import {
  PAYMENTS_UNAVAILABLE_MESSAGE,
  useUserJobs,
} from '../../context/UserJobsContext';
import { useMarketplaceSuccess } from '../../hooks/useMarketplaceSuccess';
import { openUserProfile } from '../../utils/openUserProfile';
import {
  jobsTabForViewer,
  MarketplaceSuccessKey,
} from '../../utils/marketplaceSuccess';
import {
  getNegotiationTurn,
  getWorkRequestOverflowMenu,
  negotiationActionLabel,
  overflowMenuActionLabel,
  type NegotiationAction,
  type OverflowMenuAction,
} from '../../utils/workRequestNegotiation';
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
  termsAddonsSum,
  termsChangeFromPayload,
  termsTotal,
  toIsoDate,
  workRequestApi,
} from '../../services/workRequestApi';
import { marketplaceApi } from '../../services/marketplaceApi';
import { messageService } from '../../services/messageService';

const STATUS_TONE: Record<
  ApiWorkRequest['status'],
  { bg: string; text: string }
> = {
  pending: { bg: '#FCE7F3', text: '#BE185D' },
  changes_requested: { bg: '#FEF9C3', text: '#8A6A16' },
  changes_declined: { bg: '#FFEDD5', text: '#C2410C' },
  pending_payment: { bg: '#E0ECFF', text: '#2E6AC5' },
  rejected: { bg: '#FEE2E2', text: '#B91C1C' },
  withdrawn: { bg: '#EEF2F6', text: '#627D98' },
};

const STATUS_LABEL: Record<ApiWorkRequest['status'], string> = {
  pending: 'Pending',
  changes_requested: 'Changes Requested',
  changes_declined: 'Changes Declined',
  pending_payment: 'Pending Payment',
  rejected: 'Rejected',
  withdrawn: 'Cancelled',
};

const EVENT_LABEL: Record<WorkRequestEvent['type'], string> = {
  created: 'Request Sent',
  changes_requested: 'Changes Requested',
  changes_accepted: 'Changes Accepted',
  changes_declined: 'Changes Declined',
  changes_cancelled: 'Change Request Withdrawn',
  accepted: 'Request Accepted',
  rejected: 'Request Rejected',
  withdrawn: 'Request Cancelled',
  viewed: 'Viewed',
  listing_closed: 'Listing Closed',
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
  const priceLabel =
    terms.packageName || terms.packageTier ? 'Package Price' : 'Base Price';

  return (
    <View
      style={[
        styles.termsCard,
        variant === 'proposed' && styles.proposedTermsCard,
      ]}
    >
      <Row label="Title" value={terms.title || '—'} />
      <MoneyRow
        label={priceLabel}
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
      <Text
        style={[
          styles.rowValue,
          struck && styles.struckValue,
          emphasized && styles.emphasizedValue,
        ]}
        numberOfLines={2}
      >
        {amount || fallback}
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
    cancelChanges,
    rejectRequest,
    withdrawRequest,
    markDelivered,
    markCompleted,
    markDisputed,
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
  const [workConversationId, setWorkConversationId] = useState<string | null>(
    null,
  );
  const [devStarting, setDevStarting] = useState(false);

  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel?: string;
    danger?: boolean;
    commentPlaceholder?: string;
    successKey?: MarketplaceSuccessKey;
    landingOverride?: Parameters<typeof showSuccess>[1];
    run: (comment?: string) => Promise<unknown>;
  } | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportSuccessOpen, setReportSuccessOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineText, setDeclineText] = useState('');
  /** Latest engagement_events.note for delivered → disputed (Marketplace SoT). */
  const [disputeNote, setDisputeNote] = useState<string | null>(null);
  const [disputeAt, setDisputeAt] = useState<string | null>(null);

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
    setDisputeNote(null);
    setDisputeAt(null);
    try {
      const fetched = await workRequestApi.get(requestId);
      setRequest(fetched);
      // Marking read does not bump updatedAt, so the counterparty is unaffected.
      const viewed = await workRequestApi
        .markViewed(requestId)
        .catch(() => null);
      if (viewed) setRequest(viewed);
      await refreshUnread();

      const engagementId =
        viewed?.workEngagementId ?? fetched.workEngagementId;
      const engagementStatus =
        viewed?.workEngagementStatus ?? fetched.workEngagementStatus;
      const canOpenWorkChat =
        engagementId &&
        (engagementStatus === 'in_progress' ||
          engagementStatus === 'delivered' ||
          engagementStatus === 'disputed' ||
          engagementStatus === 'completed');
      if (canOpenWorkChat) {
        const workChats = await messageService
          .listConversations('work')
          .catch(() => []);
        const match = messageService.findWorkConversation(
          workChats,
          engagementId,
        );
        setWorkConversationId(match?.id ?? null);
      } else {
        setWorkConversationId(null);
      }

      // Dispute reason lives on engagement_events — fetch only while disputed.
      if (engagementId && engagementStatus === 'disputed') {
        const engagement = await marketplaceApi
          .getEngagement(engagementId)
          .catch(() => null);
        const lastDispute = engagement
          ? [...engagement.events]
              .reverse()
              .find((e) => e.toStatus === 'disputed' && e.note?.trim())
          : undefined;
        if (lastDispute) {
          setDisputeNote(lastDispute.note.trim());
          setDisputeAt(lastDispute.createdAt);
        }
      }
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : 'Failed to load this request',
      );
      setRequest(null);
      setWorkConversationId(null);
      setDisputeNote(null);
      setDisputeAt(null);
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
   * `successKey` marks the actions that leave this screen after Done: they
   * confirm and hand off to the Jobs inbox instead of refreshing this screen.
   */
  const runAction = async (
    action: (comment?: string) => Promise<unknown>,
    successKey?: MarketplaceSuccessKey,
    landingOverride?: Parameters<typeof showSuccess>[1],
    comment?: string,
  ) => {
    setBusy(true);
    try {
      await action(comment);
      if (successKey) {
        showSuccess(successKey, landingOverride);
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

  const turn = getNegotiationTurn(request, viewerId);
  const overflow = getWorkRequestOverflowMenu(request, viewerId);
  const isPendingPayment =
    request.status === 'pending_payment' &&
    (request.workEngagementStatus === 'pending_payment' ||
      request.workEngagementStatus === null);
  const canDeliver =
    isProvider && request.workEngagementStatus === 'in_progress';
  const canConfirmDelivery =
    isClient &&
    (request.workEngagementStatus === 'delivered' ||
      request.workEngagementStatus === 'disputed');
  const canDeclineDelivery =
    isClient && request.workEngagementStatus === 'delivered';
  const isCompletedEngagement = request.workEngagementStatus === 'completed';
  const canMessageWork =
    !!request.workEngagementId &&
    (request.workEngagementStatus === 'in_progress' ||
      request.workEngagementStatus === 'delivered' ||
      request.workEngagementStatus === 'disputed' ||
      request.workEngagementStatus === 'completed');
  const deliveryWaitingMessage =
    isProvider && request.workEngagementStatus === 'delivered'
      ? 'Waiting for the client to Confirm Delivery or Decline.'
      : isProvider && request.workEngagementStatus === 'disputed'
        ? 'Waiting for the client to confirm delivery.'
        : null;
  const showDevStartWork =
    typeof __DEV__ !== 'undefined' &&
    __DEV__ &&
    isPendingPayment &&
    !!request.workEngagementId;
  const jobsTab = jobsTabForViewer(isSender);

  const openWorkChat = () => {
    if (workConversationId) {
      navigation.navigate('Chat', { conversationId: workConversationId });
      return;
    }
    Alert.alert(
      'Chat not ready',
      'The work conversation is not available yet. Try again in a moment.',
    );
  };

  const onDevStartWork = () => {
    if (!request.workEngagementId || devStarting) return;
    void (async () => {
      setDevStarting(true);
      try {
        await marketplaceApi.devStartWork(request.workEngagementId!);
        await load();
        const workChats = await messageService
          .listConversations('work')
          .catch(() => []);
        const match = messageService.findWorkConversation(
          workChats,
          request.workEngagementId!,
        );
        if (match) {
          setWorkConversationId(match.id);
          navigation.navigate('Chat', { conversationId: match.id });
        } else {
          Alert.alert(
            'Work started',
            'Engagement is in progress. Open Messages if the chat does not appear yet.',
          );
        }
      } catch (e) {
        Alert.alert(
          'Dev start work failed',
          e instanceof ApiError || e instanceof Error
            ? e.message
            : 'Is ENABLE_DEV_START_WORK=true on the backend?',
        );
      } finally {
        setDevStarting(false);
      }
    })();
  };

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

  const queueNegotiationAction = (action: NegotiationAction) => {
    switch (action) {
      case 'accept':
      case 'accept_original_terms':
        setConfirm({
          title: `${negotiationActionLabel(action)}?`,
          message:
            'This accepts the current terms and moves the request to Pending Payment.',
          confirmLabel: negotiationActionLabel(action),
          successKey: 'requestAccepted',
          landingOverride: { tab: jobsTab, section: 'pending-payment' },
          run: () => acceptRequest(request.id),
        });
        return;
      case 'accept_changes':
        setConfirm({
          title: 'Accept Changes?',
          message:
            'You agree to the proposed terms. The request will move to Pending Payment.',
          confirmLabel: 'Accept Changes',
          successKey: 'changesAccepted',
          landingOverride: { tab: jobsTab, section: 'pending-payment' },
          run: () => acceptChanges(request.id),
        });
        return;
      case 'request_changes':
      case 'request_changes_again':
        openChanges();
        return;
      case 'decline_changes':
        setConfirm({
          title: 'Decline Changes?',
          message:
            'The request stays open. The other party can Accept Original Terms, Request Changes Again, or Reject Request.',
          confirmLabel: 'Decline Changes',
          commentPlaceholder: 'Optional message…',
          successKey: 'changesDeclined',
          landingOverride: { tab: jobsTab, section: 'requests' },
          run: (comment) => declineChanges(request.id, comment),
        });
        return;
      case 'reject_request':
        setConfirm({
          title: 'Reject Request?',
          message:
            'This permanently closes the work request and moves it to History. It cannot be undone.',
          confirmLabel: 'Reject Request',
          danger: true,
          commentPlaceholder: 'Optional reason…',
          successKey: 'requestRejected',
          landingOverride: {
            tab: jobsTab,
            section: 'completed',
          },
          run: (comment) => rejectRequest(request.id, comment),
        });
        return;
      default:
        return;
    }
  };

  const queueOverflowAction = (action: OverflowMenuAction) => {
    setMenuOpen(false);
    switch (action) {
      case 'withdraw_change_request':
        setConfirm({
          title: 'Withdraw Change Request?',
          message:
            'This will withdraw your proposed changes and restore the previous negotiation state.',
          confirmLabel: 'Withdraw',
          cancelLabel: 'Cancel',
          successKey: 'changesWithdrawn',
          landingOverride: { tab: jobsTab, section: 'requests' },
          run: () => cancelChanges(request.id),
        });
        return;
      case 'cancel_request':
        setConfirm({
          title: 'Cancel Request?',
          message:
            'This will permanently cancel this request and move it to History.',
          confirmLabel: 'Cancel Request',
          cancelLabel: 'Keep Request',
          danger: true,
          successKey: 'requestCancelled',
          landingOverride: {
            tab: 'sent',
            section: 'completed',
          },
          run: () => withdrawRequest(request.id),
        });
        return;
      case 'report':
        setReportText('');
        setReportOpen(true);
        return;
      default:
        return;
    }
  };

  const submitReport = async () => {
    const description = reportText.trim();
    if (description.length < 10) return;
    setBusy(true);
    try {
      // Moderation phase will replace this stub with a real report API.
      await new Promise((resolve) => setTimeout(resolve, 350));
      setReportOpen(false);
      setReportText('');
      setReportSuccessOpen(true);
    } finally {
      setBusy(false);
    }
  };

  const submitDecline = () => {
    const explanation = declineText.trim();
    if (!explanation) {
      Alert.alert('Explanation required', 'Please describe the issue.');
      return;
    }
    if (!request.workEngagementId || busy) return;
    setDeclineOpen(false);
    setDeclineText('');
    void runAction(
      () => markDisputed(request.workEngagementId!, explanation),
      'jobDisputed',
      { tab: jobsTab, section: 'in-progress' },
    );
  };

  const primaryNegotiation = turn.actions[0] ?? null;
  const secondaryNegotiation = turn.actions.slice(1);

  const openConfirmDelivery = () =>
    setConfirm({
      title: 'Confirm Delivery?',
      message: 'Are you sure the work has been delivered as agreed?',
      confirmLabel: 'Confirm Delivery',
      successKey: 'jobCompleted',
      landingOverride: {
        tab: jobsTab,
        section: 'completed',
      },
      run: () => markCompleted(request.workEngagementId!),
    });

  /** The one call to action; everything else lives in the secondary row. */
  const primaryAction: {
    title: string;
    onPress: () => void;
  } | null = primaryNegotiation
    ? {
        title: negotiationActionLabel(primaryNegotiation),
        onPress: () => queueNegotiationAction(primaryNegotiation),
      }
    : canDeliver
      ? {
          title: 'Mark as Delivered',
          onPress: () =>
            setConfirm({
              title: 'Mark as Delivered?',
              message:
                'Confirm that you have delivered the work. The client can then Confirm Delivery or Decline.',
              confirmLabel: 'Mark as Delivered',
              successKey: 'jobDelivered',
              landingOverride: {
                tab: jobsTab,
                section: 'in-progress',
              },
              run: () => markDelivered(request.workEngagementId!),
            }),
        }
      : canConfirmDelivery
        ? {
            title: 'Confirm Delivery',
            onPress: openConfirmDelivery,
          }
        : null;

  const hasSecondaryActions =
    secondaryNegotiation.length > 0 || canDeclineDelivery;
  const waitingMessage = turn.waitingMessage ?? deliveryWaitingMessage;
  const hasFooterActions =
    !!primaryAction ||
    hasSecondaryActions ||
    !!waitingMessage ||
    isPendingPayment ||
    isCompletedEngagement ||
    canMessageWork ||
    showDevStartWork;

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

  const queueSubmitChanges = () => {
    const deadline = proposedDeadline();
    if (!deadline || !amountReady) return;
    const proposedTerms: ProposedTermsInput = { deadline };
    if (proposedAmount !== null) {
      proposedTerms.money = { amount: proposedAmount, currency };
    }
    const comment = proposalComment.trim() || undefined;
    // Close the changes sheet before opening confirm — nested RN Modals drop
    // the confirm action / payload on later renegotiation attempts.
    setChangesOpen(false);
    setConfirm({
      title: 'Request Changes?',
      message:
        'Your proposed terms will be sent to the other party for review.',
      confirmLabel: 'Send Changes',
      successKey: 'changesRequested',
      landingOverride: { tab: jobsTab, section: 'requests' },
      run: () => requestChanges(request.id, proposedTerms, comment),
    });
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
        {overflow.visible ? (
          <TouchableOpacity
            onPress={() => setMenuOpen(true)}
            style={styles.menuButton}
            hitSlop={8}
            accessibilityLabel="More actions"
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={22}
              color={colors.text}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.menuButton} />
        )}
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

        {isPendingPayment ? (
          <View style={styles.noticeCard}>
            <Ionicons name="time-outline" size={18} color="#2E6AC5" />
            <Text style={styles.noticeText}>
              {isClient
                ? 'Pending Payment — payments are coming in a later phase.'
                : 'Pending Payment — waiting for the client.'}
            </Text>
          </View>
        ) : null}

        {request.status === 'changes_declined' ? (
          <View style={[styles.noticeCard, styles.declineNotice]}>
            <Ionicons name="return-down-back-outline" size={18} color="#C2410C" />
            <Text style={[styles.noticeText, styles.declineNoticeText]}>
              {isRecipient
                ? 'Proposed changes were declined. You can Accept, Request Changes, or Reject Request.'
                : 'You declined the proposed changes. Waiting for the other party to respond.'}
              {(() => {
                const last = [...request.events]
                  .reverse()
                  .find((e) => e.type === 'changes_declined' && e.note);
                return last?.note ? `\n\n“${last.note}”` : '';
              })()}
            </Text>
          </View>
        ) : null}

        {request.workEngagementStatus === 'disputed' ? (
          <View style={[styles.noticeCard, styles.declineNotice]}>
            <Ionicons name="alert-circle-outline" size={18} color="#C2410C" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.noticeText, styles.declineNoticeText]}>
                Delivery declined
              </Text>
              {disputeNote ? (
                <Text style={[styles.noticeText, styles.declineNoticeText]}>
                  {'\n'}Reason:{'\n'}“{disputeNote}”
                </Text>
              ) : (
                <Text style={[styles.noticeText, styles.declineNoticeText]}>
                  {'\n'}The parties should resolve this through the work
                  conversation.
                </Text>
              )}
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={styles.termsCard}>
          {request.events.length === 0 && !disputeNote ? (
            <Text style={styles.rowValue}>No activity yet.</Text>
          ) : (
            <>
              {request.events.map((event) => {
                const change =
                  event.type === 'changes_requested' ||
                  event.type === 'changes_declined' ||
                  event.type === 'changes_cancelled'
                    ? termsChangeFromPayload(event.payload)
                    : null;
                // Cancelled proposals: show the event, not the term diff, so the
                // counterparty isn't asked to review discarded numbers.
                const summary =
                  change && event.type !== 'changes_cancelled'
                    ? summarizeTermsChange(change)
                    : '';
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
              })}
              {request.workEngagementStatus === 'disputed' && disputeNote ? (
                <View style={styles.eventRow}>
                  <View style={styles.eventDot} />
                  <View style={styles.eventBody}>
                    <Text style={styles.eventTitle}>Delivery Declined</Text>
                    <Text style={styles.eventNote}>{disputeNote}</Text>
                    {disputeAt ? (
                      <Text style={styles.eventTime}>
                        {formatDateTime(disputeAt)}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ) : null}
            </>
          )}
        </View>

        {(() => {
          const files = [
            ...parseAttachmentsFromNotes(request.terms.notes),
            ...parseAttachmentsFromNotes(request.proposedTerms?.notes),
            ...parseAttachmentsFromNotes(request.agreedTerms?.notes),
          ];
          const unique = files.filter(
            (file, index, all) =>
              all.findIndex((f) => f.name === file.name) === index,
          );
          if (unique.length === 0) return null;
          return (
            <>
              <Text style={styles.sectionTitle}>Supporting documents</Text>
              <Text style={styles.reviewPlaceholder}>
                Reference files attached to this request. Upload, preview, and
                download arrive in a later phase — these are not deliverables.
              </Text>
              {unique.map((file) => (
                <View key={file.id} style={styles.attachmentRow}>
                  <Ionicons
                    name={attachmentIcon(file.name)}
                    size={22}
                    color={colors.primary}
                  />
                  <View style={styles.attachmentMeta}>
                    <Text style={styles.attachmentName}>{file.name}</Text>
                    {file.size ? (
                      <Text style={styles.attachmentSize}>{file.size}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.attachmentLater}>Later</Text>
                </View>
              ))}
            </>
          );
        })()}

        {isCompletedEngagement ? (
          <View style={styles.reviewCard}>
            <Text style={styles.sectionTitleInline}>Leave a review</Text>
            <Text style={styles.reviewPlaceholder}>
              Reviews are coming in a later phase. Submission is disabled for
              now.
            </Text>
            <View style={styles.starsRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Ionicons
                  key={i}
                  name="star-outline"
                  size={28}
                  color={colors.border}
                />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {hasFooterActions ? (
        <View style={styles.footer}>
          {waitingMessage ? (
            <View style={styles.waitingCard}>
              <Ionicons
                name="hourglass-outline"
                size={18}
                color={colors.textSecondary}
              />
              <Text style={styles.waitingText}>{waitingMessage}</Text>
            </View>
          ) : null}

          {primaryAction ? (
            <Button
              title={primaryAction.title}
              fullWidth
              disabled={busy}
              onPress={primaryAction.onPress}
            />
          ) : null}

          {hasSecondaryActions ? (
            <View style={styles.secondaryActions}>
              {secondaryNegotiation.map((action) => {
                const label = negotiationActionLabel(action);
                const danger = action === 'reject_request';
                return (
                  <Button
                    key={action}
                    title={label}
                    variant="secondary"
                    style={danger ? styles.rejectHalfBtn : styles.halfBtn}
                    textStyle={
                      danger ? styles.rejectBtnText : styles.requestChangesText
                    }
                    numberOfLines={1}
                    disabled={busy}
                    onPress={() => queueNegotiationAction(action)}
                  />
                );
              })}
              {canDeclineDelivery ? (
                <Button
                  title="Decline"
                  variant="secondary"
                  style={styles.halfBtn}
                  textStyle={styles.rejectBtnText}
                  disabled={busy}
                  onPress={() => {
                    setDeclineText('');
                    setDeclineOpen(true);
                  }}
                />
              ) : null}
            </View>
          ) : null}

          {isPendingPayment && isClient ? (
            <Text style={styles.footerHint}>{PAYMENTS_UNAVAILABLE_MESSAGE}</Text>
          ) : null}

          {showDevStartWork ? (
            <Button
              title={
                devStarting ? 'Starting work…' : 'Start work (dev)'
              }
              fullWidth
              variant="secondary"
              disabled={busy || devStarting}
              onPress={onDevStartWork}
            />
          ) : null}

          {canMessageWork ? (
            <Button
              title={
                request.workEngagementStatus === 'completed'
                  ? 'View work chat'
                  : 'Message'
              }
              fullWidth
              variant={showDevStartWork || primaryAction ? 'secondary' : 'primary'}
              disabled={busy || !workConversationId}
              onPress={openWorkChat}
            />
          ) : null}
        </View>
      ) : null}

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
                label="Package / Base Price"
                placeholder="0"
                value={amountText}
                onChangeText={(text) => setAmountText(formatAmountInput(text))}
                currency={
                  (currency as 'SAR' | 'AED' | undefined) ??
                  (terms?.money?.currency as 'SAR' | 'AED' | undefined) ??
                  null
                }
                containerStyle={styles.priceField}
                error={
                  amountText.trim().length > 0 && proposedAmount === null
                    ? 'Enter an amount greater than zero.'
                    : undefined
                }
              />
              {terms ? (
                <View style={styles.currentMoneySummary}>
                  {(() => {
                    const addonsSum = termsAddonsSum(terms);
                    const proposedBase =
                      proposedAmount !== null
                        ? {
                            amount: proposedAmount,
                            currency:
                              currency ||
                              terms.money?.currency ||
                              DEFAULT_CURRENCY,
                          }
                        : terms.money;
                    const previewTotal = termsTotal({
                      money: proposedBase,
                      addons: terms.addons,
                    });
                    return (
                      <>
                        {addonsSum ? (
                          <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>
                              Add-ons (unchanged)
                            </Text>
                            <Text style={styles.summaryValue}>
                              {formatMoney(addonsSum)}
                            </Text>
                          </View>
                        ) : null}
                        {previewTotal ? (
                          <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>
                              Total (base + add-ons)
                            </Text>
                            <Text style={styles.summaryValue}>
                              {formatMoney(previewTotal)}
                            </Text>
                          </View>
                        ) : null}
                      </>
                    );
                  })()}
                </View>
              ) : null}
              {!(amountText.trim().length > 0 && proposedAmount === null) ? (
                <Text style={styles.hintText}>
                  Edits the package/base price only. Add-ons stay attached; total
                  = base + add-ons. Leave blank to keep the current base price.
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
                onPress={queueSubmitChanges}
              />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <Pressable
            style={styles.menuSheet}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.menuTitle}>Actions</Text>
            {overflow.items.map((item) => {
              const danger =
                item === 'cancel_request' || item === 'withdraw_change_request';
              return (
                <TouchableOpacity
                  key={item}
                  style={styles.menuItem}
                  disabled={busy}
                  onPress={() => queueOverflowAction(item)}
                >
                  <Text
                    style={[
                      styles.menuItemText,
                      danger ? styles.menuItemDanger : null,
                    ]}
                  >
                    {overflowMenuActionLabel(item)}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <Button
              title="Close"
              variant="secondary"
              fullWidth
              onPress={() => setMenuOpen(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={reportOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setReportOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setReportOpen(false)}
        >
          <Pressable
            style={styles.reportSheet}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Report Request</Text>
            <Text style={styles.reportDescription}>
              Please describe the issue you experienced.
            </Text>
            <TextInput
              placeholder="Describe what happened..."
              placeholderTextColor={colors.textSecondary}
              style={styles.reportInput}
              multiline
              value={reportText}
              onChangeText={setReportText}
              editable={!busy}
            />
            {reportText.trim().length > 0 && reportText.trim().length < 10 ? (
              <Text style={styles.reportHint}>
                Please enter at least 10 characters.
              </Text>
            ) : null}
            <View style={styles.reportActions}>
              <Button
                title="Cancel"
                variant="secondary"
                style={styles.halfBtn}
                disabled={busy}
                onPress={() => setReportOpen(false)}
              />
              <Button
                title="Send Report"
                style={styles.halfBtn}
                disabled={busy || reportText.trim().length < 10}
                onPress={() => void submitReport()}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={declineOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setDeclineOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setDeclineOpen(false)}
        >
          <Pressable
            style={styles.reportSheet}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Decline Delivery</Text>
            <Text style={styles.reportDescription}>
              Explain what is wrong with the delivery so the provider can
              address it.
            </Text>
            <TextInput
              placeholder="Describe the issue..."
              placeholderTextColor={colors.textSecondary}
              style={styles.reportInput}
              multiline
              value={declineText}
              onChangeText={setDeclineText}
              editable={!busy}
              maxLength={1000}
            />
            <View style={styles.reportActions}>
              <Button
                title="Cancel"
                variant="secondary"
                style={styles.halfBtn}
                disabled={busy}
                onPress={() => setDeclineOpen(false)}
              />
              <Button
                title="Send"
                style={styles.halfBtn}
                disabled={busy || !declineText.trim()}
                onPress={submitDecline}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmActionModal
        visible={Boolean(confirm)}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
        confirmLabel={confirm?.confirmLabel ?? 'Confirm'}
        cancelLabel={confirm?.cancelLabel}
        danger={confirm?.danger}
        commentPlaceholder={confirm?.commentPlaceholder}
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={(comment) => {
          if (!confirm) return;
          const pending = confirm;
          setConfirm(null);
          void runAction(
            pending.run,
            pending.successKey,
            pending.landingOverride,
            comment,
          );
        }}
      />

      <ActionBusyOverlay visible={busy} message="Updating request…" />

      <SuccessConfirmationModal
        visible={successVisible}
        title={successTitle}
        message={successMessage}
        onDone={() => void completeSuccess()}
      />

      <SuccessConfirmationModal
        visible={reportSuccessOpen}
        title="Report Submitted"
        message={
          'Thank you for your report.\n\nOur team has received it and will review it as soon as possible. If additional information is needed, someone from our team will contact you.'
        }
        onDone={() => setReportSuccessOpen(false)}
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
  menuButton: {
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
  menuBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  menuSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.screen,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  menuTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
  menuItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuItemText: { ...typography.body, color: colors.text, fontWeight: '600' },
  menuItemDanger: { color: colors.error },
  reportSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.screen,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
    maxHeight: '88%',
  },
  reportDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  reportInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    ...typography.bodySmall,
    color: colors.text,
    textAlignVertical: 'top',
  },
  reportHint: { ...typography.caption, color: colors.error },
  reportActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
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
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#E0ECFF',
    borderRadius: radius.card,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  declineNotice: { backgroundColor: '#FFEDD5' },
  noticeText: { ...typography.bodySmall, color: '#2E6AC5', flex: 1, lineHeight: 20 },
  declineNoticeText: { color: '#9A3412' },
  reviewCard: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitleInline: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 0,
  },
  reviewPlaceholder: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  reviewHint: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  starsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.button,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  attachmentMeta: { flex: 1 },
  attachmentName: { ...typography.label, color: colors.text },
  attachmentSize: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  attachmentLater: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  attachmentAction: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
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
  waitingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 10,
  },
  waitingText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  secondaryActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
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
  modalHint: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  confirmActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  fieldLabel: { ...typography.caption, color: colors.textSecondary },
  hintText: { ...typography.caption, color: colors.textTertiary },
  priceField: { marginBottom: spacing.sm },
  currentMoneySummary: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
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
