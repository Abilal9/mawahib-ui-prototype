import { Post } from '../types';
import { users } from './users';
import { ownProfileUser } from './myProfile';

const karen = users.find((u) => u.id === 'u-karen')!;

export const posts: Post[] = [
  {
    id: 'p-own-1',
    author: ownProfileUser,
    caption:
      'Behind the scenes from last weekend’s event — natural light and candid moments.',
    images: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=600&fit=crop',
    ],
    likes: 412,
    comments: 28,
    shares: 9,
    isLiked: false,
    isSaved: false,
    createdAt: '2026-07-14T09:00:00Z',
    role: 'Event Photographer',
    timeAgo: '1d',
  },
  {
    id: 'p-own-2',
    author: ownProfileUser,
    caption: 'Studio portraits with soft gels. Love how the tones came out.',
    images: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=600&fit=crop',
    ],
    likes: 890,
    comments: 54,
    shares: 21,
    isLiked: false,
    isSaved: true,
    createdAt: '2026-07-13T14:00:00Z',
    role: 'Event Photographer',
    timeAgo: '2d',
  },
  {
    id: 'p-own-3',
    author: ownProfileUser,
    caption: 'Quick edit pass on a corporate headshot series.',
    images: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=600&fit=crop',
    ],
    likes: 256,
    comments: 12,
    shares: 4,
    isLiked: false,
    isSaved: false,
    createdAt: '2026-07-10T11:00:00Z',
    role: 'Event Photographer',
    timeAgo: '5d',
  },
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
    id: 'p-karen-2',
    author: karen,
    caption: 'Wireframes to high-fidelity — documenting the product design process.',
    images: [
      'https://images.unsplash.com/photo-1581291518857-4e27b48ff50f?w=600&h=600&fit=crop',
    ],
    likes: 540,
    comments: 33,
    shares: 11,
    isLiked: false,
    isSaved: false,
    createdAt: '2026-07-11T12:00:00Z',
    role: 'Product Designer',
    timeAgo: '3d',
  },
  {
    id: 'p-karen-3',
    author: karen,
    caption: 'Component library refresh for a fintech dashboard.',
    images: [
      'https://images.unsplash.com/photo-1559028012-481c04fa702d?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=600&fit=crop',
    ],
    likes: 318,
    comments: 19,
    shares: 7,
    isLiked: false,
    isSaved: true,
    createdAt: '2026-07-09T16:00:00Z',
    role: 'Product Designer',
    timeAgo: '1w',
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
