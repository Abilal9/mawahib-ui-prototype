import { Post } from '../data/types';
import { posts, getPostById } from '../data/mock/posts';

export const postService = {
  async list(): Promise<Post[]> {
    return posts;
  },

  async getById(id: string): Promise<Post | undefined> {
    return getPostById(id);
  },
};
