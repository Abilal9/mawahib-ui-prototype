import { ApiWorkRequest } from '../services/workRequestApi';

/** Negotiation actions available on an open work request (pre–Pending Payment). */
export type NegotiationAction =
  | 'accept'
  | 'accept_original_terms'
  | 'accept_changes'
  | 'request_changes'
  | 'request_changes_again'
  | 'decline_changes'
  | 'reject_request';

export type NegotiationDecisionMaker = 'sender' | 'recipient' | null;

/** Secondary actions shown only in the header ⋯ overflow menu. */
export type OverflowMenuAction =
  | 'withdraw_change_request'
  | 'cancel_request'
  | 'report';

export interface NegotiationTurn {
  /** Whose turn it is to negotiate (null when terminal / past negotiation). */
  decisionMaker: NegotiationDecisionMaker;
  /** Viewer is the negotiation decision maker. */
  isMyTurn: boolean;
  /** Ordered primary negotiation actions for the footer (never Cancel Request). */
  actions: NegotiationAction[];
  /** Shown when the viewer has no negotiation actions and is waiting. */
  waitingMessage: string | null;
}

export interface WorkRequestOverflowMenu {
  /** Header ⋯ is available for either party on this request. */
  visible: boolean;
  /** Ordered secondary / destructive actions for the overflow sheet. */
  items: OverflowMenuAction[];
}

const ACTION_LABEL: Record<NegotiationAction, string> = {
  accept: 'Accept',
  accept_original_terms: 'Accept Original Terms',
  accept_changes: 'Accept Changes',
  request_changes: 'Request Changes',
  request_changes_again: 'Request Changes Again',
  decline_changes: 'Decline Changes',
  reject_request: 'Reject Request',
};

const OVERFLOW_LABEL: Record<OverflowMenuAction, string> = {
  withdraw_change_request: 'Withdraw Change Request',
  cancel_request: 'Cancel Request',
  report: 'Report',
};

export function negotiationActionLabel(action: NegotiationAction): string {
  return ACTION_LABEL[action];
}

export function overflowMenuActionLabel(action: OverflowMenuAction): string {
  return OVERFLOW_LABEL[action];
}

/**
 * Single source of truth for turn-based negotiation ownership and footer actions.
 * Derived from status + sender/recipient — no separate turn field required.
 * Cancel Request / Withdraw / Report live in {@link getWorkRequestOverflowMenu}.
 */
export function getNegotiationTurn(
  request: Pick<
    ApiWorkRequest,
    'status' | 'senderUserId' | 'recipientUserId'
  >,
  viewerId: string,
): NegotiationTurn {
  const isSender = request.senderUserId === viewerId;
  const isRecipient = request.recipientUserId === viewerId;
  const open =
    request.status === 'pending' ||
    request.status === 'changes_requested' ||
    request.status === 'changes_declined';

  let decisionMaker: NegotiationDecisionMaker = null;
  if (request.status === 'pending' || request.status === 'changes_declined') {
    decisionMaker = 'recipient';
  } else if (request.status === 'changes_requested') {
    decisionMaker = 'sender';
  }

  const isMyTurn =
    decisionMaker === 'sender'
      ? isSender
      : decisionMaker === 'recipient'
        ? isRecipient
        : false;

  let actions: NegotiationAction[] = [];
  if (isMyTurn && request.status === 'pending' && isRecipient) {
    actions = ['accept', 'request_changes', 'reject_request'];
  } else if (isMyTurn && request.status === 'changes_requested' && isSender) {
    actions = ['accept_changes', 'decline_changes'];
  } else if (isMyTurn && request.status === 'changes_declined' && isRecipient) {
    actions = [
      'accept_original_terms',
      'request_changes_again',
      'reject_request',
    ];
  }

  let waitingMessage: string | null = null;
  if (open && !isMyTurn) {
    waitingMessage =
      request.status === 'changes_requested' && isRecipient
        ? 'Waiting for the requester to respond.'
        : 'Waiting for the other user to respond.';
  }

  return {
    decisionMaker,
    isMyTurn,
    actions,
    waitingMessage,
  };
}

/**
 * Secondary / destructive actions for the header ⋯ menu.
 * Does not include primary negotiation buttons (those stay in the footer).
 */
export function getWorkRequestOverflowMenu(
  request: Pick<
    ApiWorkRequest,
    | 'status'
    | 'senderUserId'
    | 'recipientUserId'
    | 'proposedByUserId'
    | 'workEngagementStatus'
  >,
  viewerId: string,
): WorkRequestOverflowMenu {
  const isSender = request.senderUserId === viewerId;
  const isRecipient = request.recipientUserId === viewerId;
  if (!isSender && !isRecipient) {
    return { visible: false, items: [] };
  }

  const open =
    request.status === 'pending' ||
    request.status === 'changes_requested' ||
    request.status === 'changes_declined';

  const beforePayment = open;
  const items: OverflowMenuAction[] = [];

  if (beforePayment) {
    const isWaitingProposer =
      request.status === 'changes_requested' &&
      isRecipient &&
      (!request.proposedByUserId || request.proposedByUserId === viewerId);

    if (isWaitingProposer) {
      items.push('withdraw_change_request');
    }
    if (isSender) {
      items.push('cancel_request');
    }
  }

  items.push('report');
  return { visible: true, items };
}
