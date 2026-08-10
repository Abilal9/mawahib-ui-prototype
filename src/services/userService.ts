import { User } from '../data/types';
import { repositories } from '../repositories';

const repo = repositories.users;

/**
 * Directory/catalog helpers for mock social graph & explore data.
 * Do NOT use getCurrent* as the authenticated identity — use `useAuth().mappedUser`.
 */
export const userService = {
  /** @deprecated Mock catalog only — not the authenticated user */
  async getCurrent(): Promise<User> {
    return repo.getCurrent();
  },

  /** @deprecated Mock catalog only — not the authenticated user */
  getCurrentSync(): User {
    return repo.getCurrent();
  },

  async list(): Promise<User[]> {
    return repo.list();
  },

  listSync(): User[] {
    return repo.list();
  },

  async getById(id: string): Promise<User | undefined> {
    return repo.getById(id);
  },

  getByIdSync(id: string): User | undefined {
    return repo.getById(id);
  },

  resolveProfileUser(userId: string): User | undefined {
    return repo.resolveProfileUser(userId);
  },
};
