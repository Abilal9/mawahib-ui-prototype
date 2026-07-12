import { Post } from '../types';
import { users } from './users';

const karen = users.find((u) => u.id === 'u-karen')!;

export const posts: Post[] = [
  {
    id: 'p-figma',
    author: karen,
    caption:
      'Habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Sed tempus urna et pharetra pharetra massa massa ultricies.',
    images: [
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop',
    ],
    likes: 200,
    comments: 100,
    shares: 24,
    isLiked: false,
    isSaved: false,
    createdAt: '2026-07-12T08:00:00Z',
    role: 'Product Designer',
    timeAgo: '2h',
  },
  {
    id: 'p1',
    author: users[4],
    caption: 'Golden hour shoot in the desert dunes. Nothing beats natural light for portrait photography.',
    images: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=600&fit=crop',
    ],
    likes: 2847,
    comments: 156,
    shares: 42,
    isLiked: false,
    isSaved: true,
    createdAt: '2026-07-12T10:30:00Z',
    location: 'Dubai Desert',
  },
  {
    id: 'p2',
    author: users[5],
    caption: 'Just shipped a new React Native app for a fintech startup. Clean architecture and 60fps everywhere.',
    images: ['https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop'],
    likes: 1523,
    comments: 89,
    shares: 67,
    isLiked: true,
    isSaved: false,
    createdAt: '2026-07-11T16:45:00Z',
  },
];

export const getPostById = (id: string): Post | undefined =>
  posts.find((p) => p.id === id);
