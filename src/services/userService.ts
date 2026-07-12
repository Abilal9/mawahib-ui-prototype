import { User } from '../data/types';
import { users, currentUser, getUserById } from '../data/mock/users';

export const userService = {
  async getCurrent(): Promise<User> {
    return currentUser;
  },

  async list(): Promise<User[]> {
    return users;
  },

  async getById(id: string): Promise<User | undefined> {
    return getUserById(id);
  },
};
