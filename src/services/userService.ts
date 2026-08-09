import { User } from '../data/types';
import { repositories } from '../repositories';

const repo = repositories.users;

export const userService = {
  async getCurrent(): Promise<User> {
    return repo.getCurrent();
  },

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
