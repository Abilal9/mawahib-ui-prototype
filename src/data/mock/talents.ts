import { Talent } from '../types';
import { DEV_BACKEND_USERS } from '../../config/devBackendUsers';
import { users } from './users';

/**
 * Explore talent cards.
 *
 * First entries use real Nest seed UUIDs so Home/Search can open visitor profiles.
 * Remaining entries are temporary UI placeholders until Explore has a backend —
 * `openUserProfile` will not navigate them (non-UUID ids).
 */
export const talents: Talent[] = [
  {
    id: 't-layla-dev',
    user: {
      id: DEV_BACKEND_USERS.layla.id,
      name: DEV_BACKEND_USERS.layla.name,
      username: DEV_BACKEND_USERS.layla.username,
      avatar: DEV_BACKEND_USERS.layla.avatar,
      title: DEV_BACKEND_USERS.layla.title,
      location: DEV_BACKEND_USERS.layla.location,
      bio: '',
      skills: ['Branding', 'UI Design', 'Illustration'],
      followers: 0,
      following: 0,
      posts: 0,
      isVerified: true,
      rating: 0,
      reviewCount: 0,
    },
    category: 'Design',
    rating: 0,
    reviewCount: 0,
    hourlyRate: 250,
    rateLabel: 'From Nest services',
    skills: ['Branding', 'UI Design', 'Illustration'],
    mutualConnections: 0,
    mutualAvatars: [],
    connectStatus: 'connect',
    tags: ['Saudi Made', 'Local Talent', 'Visual Artists'],
  },
  {
    id: 't-najd-dev',
    user: {
      id: DEV_BACKEND_USERS.najd.id,
      name: DEV_BACKEND_USERS.najd.name,
      username: DEV_BACKEND_USERS.najd.username,
      avatar: DEV_BACKEND_USERS.najd.avatar,
      title: DEV_BACKEND_USERS.najd.title,
      location: DEV_BACKEND_USERS.najd.location,
      bio: '',
      skills: ['Campaign Design', 'Content', 'Art Direction'],
      followers: 0,
      following: 0,
      posts: 0,
      isVerified: true,
      rating: 0,
      reviewCount: 0,
    },
    category: 'Design',
    rating: 0,
    reviewCount: 0,
    hourlyRate: 400,
    rateLabel: 'From Nest services',
    skills: ['Campaign Design', 'Content'],
    mutualConnections: 0,
    mutualAvatars: [],
    connectStatus: 'connect',
    tags: ['Saudi Made', 'Local Talent', 'Visual Artists'],
  },
  // Temporary explore placeholders (non-UUID) — not navigable to Nest visitor profiles.
  {
    id: 't1',
    user: {
      ...users[1],
      id: 'explore-placeholder-omar',
      name: 'Omar Al Qahtani',
      title: 'Videographer',
      location: 'Riyadh, Saudi Arabia',
      isVerified: true,
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    },
    category: 'Video',
    rating: 4.0,
    reviewCount: 1880,
    hourlyRate: 400,
    rateLabel: '400 SAR / event',
    skills: ['Videography', 'Editing'],
    mutualConnections: 2,
    mutualAvatars: [users[0].avatar, users[2].avatar, users[3].avatar],
    connectStatus: 'connect',
    tags: ['Saudi Made', 'Local Talent', 'Videographers', 'Visual Artists'],
  },
  {
    id: 't2',
    user: {
      ...users[4],
      id: 'explore-placeholder-faisal',
      name: 'Faisal Al Saud',
      title: 'Videographer',
      location: 'Riyadh, Saudi Arabia',
      isVerified: true,
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
    },
    category: 'Video',
    rating: 4.0,
    reviewCount: 1880,
    hourlyRate: 400,
    rateLabel: '400 SAR / event',
    skills: ['Videography', 'Events'],
    mutualConnections: 2,
    mutualAvatars: [users[0].avatar, users[2].avatar, users[3].avatar],
    connectStatus: 'added',
    tags: ['Saudi Made', 'Local Talent', 'Videographers'],
  },
  {
    id: 't3',
    user: {
      ...users[5],
      id: 'explore-placeholder-noura',
      name: 'Noura Al Harbi',
      title: 'Photographer',
      location: 'Jeddah, Saudi Arabia',
      isVerified: true,
      avatar:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    },
    category: 'Photography',
    rating: 4.8,
    reviewCount: 420,
    hourlyRate: 350,
    rateLabel: '350 SAR / session',
    skills: ['Portrait', 'Events'],
    mutualConnections: 3,
    mutualAvatars: [users[0].avatar, users[1].avatar, users[2].avatar],
    connectStatus: 'request-sent',
    tags: ['Saudi Made', 'Local Talent', 'Photographers', 'Visual Artists'],
  },
];

export const recentSearches: string[] = [
  'UI Designer Dubai',
  'React Native Developer',
  'Brand Photographer',
  'Motion Graphics',
  'Logo Design',
];
