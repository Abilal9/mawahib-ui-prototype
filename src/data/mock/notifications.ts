import { Notification } from '../types';
import { users } from './users';

export type NotificationTab =
  | 'All'
  | 'Jobs'
  | 'Messages'
  | 'Connections'
  | 'Platform Updates';

export const NOTIFICATION_TABS: NotificationTab[] = [
  'All',
  'Jobs',
  'Messages',
  'Connections',
  'Platform Updates',
];

export function tabForNotification(n: Notification): Exclude<NotificationTab, 'All'> {
  switch (n.type) {
    case 'job':
      return 'Jobs';
    case 'message':
      return 'Messages';
    case 'follow':
      return 'Connections';
    case 'system':
      return 'Platform Updates';
    case 'like':
    case 'comment':
    default:
      return 'Platform Updates';
  }
}

export function filterNotifications(
  items: Notification[],
  tab: NotificationTab
): Notification[] {
  if (tab === 'All') return items;
  return items.filter((n) => tabForNotification(n) === tab);
}

export const notifications: Notification[] = [
  {
    id: 'n1',
    type: 'job',
    title: 'Job Request',
    message: "Nawaf Alsaeed requested your service 'Logo Design.'",
    createdAt: '2026-07-14T09:42:00Z',
    read: false,
    jobId: 'j1',
    actions: ['accept', 'decline'],
  },
  {
    id: 'n2',
    type: 'job',
    title: 'Job Completed',
    message: 'Nawaf Alsaeed marked the job as completed.',
    createdAt: '2026-07-14T09:42:00Z',
    read: true,
    jobId: 'j1',
    showRating: true,
  },
  {
    id: 'n3',
    type: 'job',
    title: 'Request Accepted',
    message: 'Nawaf Alsaeed Accepted your Job request!',
    createdAt: '2026-07-14T09:42:00Z',
    read: true,
    jobId: 'j2',
  },
  {
    id: 'n4',
    type: 'job',
    title: 'Request Declined',
    message: 'Nawaf Alsaeed Declined your Job request!',
    createdAt: '2026-07-14T09:42:00Z',
    read: true,
    jobId: 'j3',
  },
  {
    id: 'n5',
    type: 'job',
    title: 'Payment processed',
    message: 'Your payment of SAR 100 was processed!',
    createdAt: '2026-07-14T09:42:00Z',
    read: true,
  },
  {
    id: 'n6',
    type: 'message',
    title: 'New Message',
    user: users[1],
    message: 'Karen Pagac sent you a message',
    createdAt: '2026-07-13T18:00:00Z',
    read: false,
  },
  {
    id: 'n7',
    type: 'follow',
    title: 'New Connection',
    user: users[4],
    message: 'Omar Hassan wants to connect with you',
    createdAt: '2026-07-13T12:00:00Z',
    read: false,
  },
  {
    id: 'n8',
    type: 'system',
    title: 'Platform Update',
    message: 'Your profile is now featured in the Explore section!',
    createdAt: '2026-07-11T08:00:00Z',
    read: true,
  },
];
