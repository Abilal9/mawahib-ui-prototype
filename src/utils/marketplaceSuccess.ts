import { CommonActions, NavigationProp, ParamListBase } from '@react-navigation/native';
import { UserJobSection } from '../data/types/userJobs';

export type JobsTabKey = 'sent' | 'received';

export interface JobsLanding {
  tab: JobsTabKey;
  section?: UserJobSection;
}

export interface MarketplaceSuccessCopy {
  title: string;
  message: string;
  landing: JobsLanding;
}

/** Canonical success copy + Jobs landing for each marketplace action. */
export const MARKETPLACE_SUCCESS = {
  jobPosted: {
    title: 'Job Posted',
    message: 'Your job has been published successfully.',
    landing: { tab: 'sent', section: 'posted' },
  },
  applicationSent: {
    title: 'Application Sent',
    message: 'Your application has been sent to the job owner.',
    landing: { tab: 'sent', section: 'requests' },
  },
  serviceRequestSent: {
    title: 'Service Request Sent',
    message: 'Your service request has been sent successfully.',
    landing: { tab: 'sent', section: 'requests' },
  },
  directRequestSent: {
    title: 'Request Sent',
    message: 'Your work request has been sent successfully.',
    landing: { tab: 'sent', section: 'requests' },
  },
  requestAccepted: {
    title: 'Request Accepted',
    message:
      'The request has been accepted.\n\nWaiting for payment is now required before work can begin.',
    landing: { tab: 'received', section: 'pending-payment' },
  },
  requestRejected: {
    title: 'Request Rejected',
    message: 'This work request has been closed.',
    landing: { tab: 'received', section: 'completed' },
  },
  changesRequested: {
    title: 'Changes Requested',
    message: 'Your requested changes have been sent.',
    landing: { tab: 'received', section: 'requests' },
  },
  changesAccepted: {
    title: 'Changes Accepted',
    message:
      'Both parties have now agreed to the request.\n\nWaiting for payment before work begins.',
    landing: { tab: 'sent', section: 'pending-payment' },
  },
  changesDeclined: {
    title: 'Changes Declined',
    message:
      'Your response was sent. The other party can accept the original terms, propose again, or reject the request.',
    landing: { tab: 'sent', section: 'requests' },
  },
  changesCancelled: {
    title: 'Change Request Cancelled',
    message:
      'Your proposed changes were cancelled. The request is open again for accept, reject, or a new change request.',
    landing: { tab: 'received', section: 'requests' },
  },
  requestWithdrawn: {
    title: 'Request Withdrawn',
    message: 'Your request has been withdrawn successfully.',
    landing: { tab: 'sent', section: 'completed' },
  },
  jobDelivered: {
    title: 'Marked as Delivered',
    message: 'The client can now confirm completion.',
    landing: { tab: 'received', section: 'in-progress' },
  },
  jobCompleted: {
    title: 'Job Completed',
    message: 'This engagement has been completed successfully.',
    landing: { tab: 'sent', section: 'completed' },
  },
  listingArchived: {
    title: 'Listing Archived',
    message: 'Your listing has been archived.',
    landing: { tab: 'sent', section: 'posted' },
  },
  listingReopened: {
    title: 'Listing Reopened',
    message: 'Your listing is live again.',
    landing: { tab: 'sent', section: 'posted' },
  },
  listingClosed: {
    title: 'Listing Closed',
    message: 'Your listing has been closed.',
    landing: { tab: 'sent', section: 'posted' },
  },
} as const satisfies Record<string, MarketplaceSuccessCopy>;

export type MarketplaceSuccessKey = keyof typeof MARKETPLACE_SUCCESS;

/**
 * Reset the root stack onto Jobs with the target tab/section so Back
 * does not return into completed forms.
 */
export function resetToJobs(
  navigation: NavigationProp<ParamListBase>,
  landing: JobsLanding,
): void {
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: 'MainTabs',
          params: {
            screen: 'JobsTab',
            params: {
              tab: landing.tab,
              section: landing.section,
            },
          },
        },
      ],
    }),
  );
}
