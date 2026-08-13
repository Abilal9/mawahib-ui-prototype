import { ApiWorkRequest } from '../services/workRequestApi';

/** Negotiation actions available on an open work request (pre–Pending Payment). */
export type NegotiationAction =
  | 'accept'
  | 'accept_original_terms'
  | 'accept_changes'
  | 'request_changes'
  | 'request_changes_again'
  | 'decline_changes'
  | 'reject_request'
  | 'cancel_request';

export type NegotiationDecisionMaker = 'sender' | 'recipient' | null;

export interface NegotiationTurn {
  /** Whose turn it is to negotiate (null when terminal / past negotiation). */
  decisionMaker: NegotiationDecisionMaker;
  /** Viewer is the negotiation decision maker. */
  isMyTurn: boolean;
  /** Original sender may Cancel Request even when it is not their turn. */
  canCancelRequest: boolean;
  /** Ordered negotiation actions for the viewer (excludes cancel_request). */
  actions: NegotiationAction[];
  /** Shown when the viewer has no negotiation actions and is waiting. */
  waitingMessage: string | null;
}

const ACTION_LABEL: Record<NegotiationAction, string> = {
  accept: 'Accept',
  accept_original_terms: 'Accept Original Terms',
  accept_changes: 'Accept Changes',
  request_changes: 'Request Changes',
  request_changes_again: 'Request Changes Again',
  decline_changes: 'Decline Changes',
  reject_request: 'Reject Request',
  cancel_request: 'Cancel Request',
};

export function negotiationActionLabel(action: NegotiationAction): string {
  return ACTION_LABEL[action];
}

/**
 * Single source of truth for turn-based negotiation ownership and actions.
 * Derived from status + sender/recipient — no separate turn field required.
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

  const canCancelRequest = isSender && open;

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
    canCancelRequest,
    actions,
    waitingMessage,
  };
}
