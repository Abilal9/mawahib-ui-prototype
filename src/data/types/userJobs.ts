import { User } from './index';

export type UserJobStatus =
  | 'pending'
  | 'sent-for-review'
  | 'pending-payment'
  | 'in-progress'
  | 'upcoming'
  | 'done'
  | 'completed'
  | 'declined'
  | 'sent';

export interface UserJob {
  id: string;
  title: string;
  type: 'received' | 'sent';
  status: UserJobStatus;
  statusLabel: string;
  counterpart: User;
  date: string;
  createdAt: string;
  dueDate?: string;
  jobType?: string;
  section?:
    | 'requests'
    | 'in-progress'
    | 'upcoming'
    | 'completed'
    | 'posted'
    | 'history';
  activityLabel?: string;
  activityValue?: string;
}
