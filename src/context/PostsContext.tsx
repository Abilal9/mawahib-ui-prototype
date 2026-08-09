import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { Comment, Post, User } from '../data/types';
import { postService } from '../services';

interface PostsContextValue {
  posts: Post[];
  refresh: () => void;
  createPost: (author: User, caption: string, images?: string[]) => Post;
  getPostById: (id: string) => Post | undefined;
  getComments: (postId: string) => Comment[];
  addComment: (postId: string, comment: Omit<Comment, 'id'>) => Comment;
}

const PostsContext = createContext<PostsContextValue | undefined>(undefined);

export function PostsProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  const value = useMemo<PostsContextValue>(() => {
    void version;
    return {
      posts: postService.listSync(),
      refresh,
      createPost: (author, caption, images) => {
        const post = postService.create(author, caption, images);
        refresh();
        return post;
      },
      getPostById: (id) => postService.getByIdSync(id),
      getComments: (postId) => postService.getComments(postId),
      addComment: (postId, comment) => {
        const created = postService.addComment(postId, comment);
        refresh();
        return created;
      },
    };
  }, [version]);

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>;
}

export function usePosts() {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error('usePosts must be used within PostsProvider');
  return ctx;
}
