import { Story } from '../types';
import { currentUser, users } from './users';

const karen = users.find((u) => u.id === 'u-karen')!;
const jan = users.find((u) => u.id === 'u-jan')!;
const cheryl = users.find((u) => u.id === 'u-cheryl')!;

export const stories: Story[] = [
  {
    id: 's-yours',
    user: currentUser,
    seen: false,
    isOwn: true,
    items: [
      {
        id: 'si-yours-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=700&fit=crop',
        duration: 5000,
      },
    ],
  },
  {
    id: 's-karen',
    user: karen,
    seen: false,
    items: [
      {
        id: 'si-k1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=700&fit=crop',
        duration: 5000,
      },
    ],
  },
  {
    id: 's-jan',
    user: jan,
    seen: false,
    items: [
      {
        id: 'si-j1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=700&fit=crop',
        duration: 5000,
      },
    ],
  },
  {
    id: 's-cheryl',
    user: cheryl,
    seen: true,
    items: [
      {
        id: 'si-c1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=700&fit=crop',
        duration: 5000,
      },
    ],
  },
];

export const getStoryById = (id: string): Story | undefined =>
  stories.find((s) => s.id === id);
