import { Comment, Post } from '../../data/types';
import { posts as seedPosts } from '../../data/mock/posts';
import { CreatePostInput, PostRepository } from '../types';

/** In-memory feed store — mock only; swap for API later. */
let feed: Post[] = seedPosts.map((p) => ({ ...p, images: [...p.images] }));

const commentsByPost: Record<string, Comment[]> = {
  'p-own-1': [
    {
      id: 'c-seed-1',
      userId: 'u-karen',
      user: 'Karen Pagac',
      avatar: '',
      text: 'Beautiful work!',
      time: '2h',
    },
  ],
};

export const mockPostRepository: PostRepository = {
  list: () => feed,
  getById: (id) => feed.find((p) => p.id === id),
  create: (input: CreatePostInput) => {
    const post: Post = {
      id: `p-${Date.now()}`,
      author: input.author,
      caption: input.caption,
      images:
        input.images && input.images.length > 0
          ? input.images
          : [
              'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=600&fit=crop',
            ],
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
      isSaved: false,
      createdAt: new Date().toISOString(),
      role: input.author.title,
      timeAgo: 'Just now',
    };
    feed = [post, ...feed];
    return post;
  },
  getComments: (postId) => commentsByPost[postId] ?? [],
  addComment: (postId, comment) => {
    const created: Comment = { ...comment, id: `c-${Date.now()}` };
    commentsByPost[postId] = [...(commentsByPost[postId] ?? []), created];
    feed = feed.map((p) =>
      p.id === postId ? { ...p, comments: p.comments + 1 } : p
    );
    return created;
  },
};

/** Reset helper for sign-out / tests (prototype). */
export function resetMockPosts() {
  feed = seedPosts.map((p) => ({ ...p, images: [...p.images] }));
}
