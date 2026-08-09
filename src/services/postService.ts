import { Comment, Post, User } from '../data/types';
import { repositories } from '../repositories';

const repo = repositories.posts;

export const postService = {
  async list(): Promise<Post[]> {
    return repo.list();
  },

  listSync(): Post[] {
    return repo.list();
  },

  async getById(id: string): Promise<Post | undefined> {
    return repo.getById(id);
  },

  getByIdSync(id: string): Post | undefined {
    return repo.getById(id);
  },

  create(author: User, caption: string, images?: string[]): Post {
    return repo.create({ author, caption, images });
  },

  getComments(postId: string): Comment[] {
    return repo.getComments(postId);
  },

  addComment(postId: string, comment: Omit<Comment, 'id'>): Comment {
    return repo.addComment(postId, comment);
  },
};
