import { User } from './index';

export type UserJobStatus =
  | 'pending'
  | 'in-progress'
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
  dueDate?: string;
  jobType?: string;
  section?: 'requests' | 'in-progress' | 'history';
}
