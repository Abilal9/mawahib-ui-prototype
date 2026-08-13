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
    title: 'Job Published',
    message: 'Your job listing has been published successfully.',
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
      'The request has been accepted.\n\nIt is now in Pending Payment. Payment is required before work can begin.',
    landing: { tab: 'received', section: 'pending-payment' },
  },
  requestRejected: {
    title: 'Request Rejected',
    message: 'This work request has been closed and moved to History.',
    landing: { tab: 'received', section: 'completed' },
  },
  requestCancelled: {
    title: 'Request Cancelled',
    message: 'You cancelled this work request. It is now in History.',
    landing: { tab: 'sent', section: 'completed' },
  },
  changesRequested: {
    title: 'Changes Requested',
    message: 'Your requested changes have been sent.',
    landing: { tab: 'received', section: 'requests' },
  },
  changesAccepted: {
    title: 'Changes Accepted',
    message:
      'Both parties have agreed to the request.\n\nIt is now in Pending Payment.',
    landing: { tab: 'sent', section: 'pending-payment' },
  },
  changesDeclined: {
    title: 'Changes Declined',
    message:
      'Your response was sent. The other party can accept, request new changes, or reject the request.',
    landing: { tab: 'sent', section: 'requests' },
  },
  jobDelivered: {
    title: 'Marked as Delivered',
    message: 'The client can now complete the job.',
    landing: { tab: 'sent', section: 'in-progress' },
  },
  jobCompleted: {
    title: 'Job Completed',
    message: 'This engagement is complete and is now in History.',
    landing: { tab: 'sent', section: 'completed' },
  },
  listingArchived: {
    title: 'Listing Archived',
    message:
      'Your listing has been archived. Open negotiations on it were closed.',
    landing: { tab: 'sent', section: 'posted' },
  },
  listingReopened: {
    title: 'Listing Reopened',
    message: 'Your listing is live again for new applicants.',
    landing: { tab: 'sent', section: 'posted' },
  },
  listingClosed: {
    title: 'Listing Closed',
    message:
      'Your listing has been closed. Open negotiations on it were closed.',
    landing: { tab: 'sent', section: 'posted' },
  },
  listingDeleted: {
    title: 'Listing Deleted',
    message:
      'Your listing was removed. Open negotiations on it were closed.',
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
