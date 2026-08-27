import type { Comment, Post, User } from '../data/types';
import {
  mapApiComment,
  mapFeedAuthor,
  mapFeedPost,
  postsApi,
  type ApiEngagement,
} from './postsApi';

function applyEngagement(post: Post, eng: ApiEngagement): Post {
  return {
    ...post,
    likes: eng.likeCount,
    comments: eng.commentCount,
    isLiked: eng.isLiked,
    isSaved: eng.isSaved,
  };
}

export const postService = {
  async listFeed(cursor?: string, limit = 20) {
    const page = await postsApi.listFeed({ cursor, limit });
    return {
      items: page.items.map(mapFeedPost),
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
    };
  },

  async getById(id: string): Promise<Post> {
    return mapFeedPost(await postsApi.getById(id));
  },

  async create(input: {
    text?: string;
    mediaAssetIds?: string[];
  }): Promise<Post> {
    return mapFeedPost(await postsApi.create(input));
  },

  async softDelete(id: string): Promise<void> {
    await postsApi.softDelete(id);
  },

  async like(id: string): Promise<ApiEngagement> {
    return postsApi.like(id);
  },

  async unlike(id: string): Promise<ApiEngagement> {
    return postsApi.unlike(id);
  },

  async save(id: string): Promise<ApiEngagement> {
    return postsApi.save(id);
  },

  async unsave(id: string): Promise<ApiEngagement> {
    return postsApi.unsave(id);
  },

  async listComments(postId: string): Promise<Comment[]> {
    const page = await postsApi.listComments(postId, { limit: 50 });
    return page.items.map(mapApiComment);
  },

  async addComment(postId: string, text: string): Promise<Comment> {
    return mapApiComment(await postsApi.createComment(postId, text));
  },

  async deleteComment(commentId: string): Promise<void> {
    await postsApi.deleteComment(commentId);
  },

  async listLikes(
    postId: string,
    cursor?: string,
  ): Promise<{
    items: User[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const page = await postsApi.listLikes(postId, { cursor, limit: 30 });
    return {
      items: page.items.map(mapFeedAuthor),
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
    };
  },

  async listUserPosts(userId: string, cursor?: string) {
    const page = await postsApi.listUserPosts(userId, { cursor, limit: 20 });
    return {
      items: page.items.map(mapFeedPost),
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
    };
  },

  applyEngagement,
};
