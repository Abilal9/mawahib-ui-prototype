import { User } from '../types';
import { users, currentUser } from './users';

export const connections: User[] = users.filter((u) => u.id !== currentUser.id);

export const getConnectionById = (id: string) => connections.find((u) => u.id === id);
