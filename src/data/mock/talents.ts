import { Talent } from '../types';
import { users } from './users';

export const talents: Talent[] = [
  {
    id: 't1',
    user: users[0],
    category: 'Design',
    rating: 4.9,
    hourlyRate: 150,
    skills: ['UI Design', 'Figma', 'Branding'],
  },
  {
    id: 't2',
    user: users[1],
    category: 'Development',
    rating: 4.7,
    hourlyRate: 120,
    skills: ['React Native', 'TypeScript', 'Node.js'],
  },
  {
    id: 't3',
    user: users[2],
    category: 'Photography',
    rating: 5.0,
    hourlyRate: 200,
    skills: ['Portrait', 'Commercial', 'Lightroom'],
  },
  {
    id: 't4',
    user: users[3],
    category: 'Video',
    rating: 4.6,
    hourlyRate: 100,
    skills: ['After Effects', 'Premiere', 'Motion Graphics'],
  },
  {
    id: 't5',
    user: users[4],
    category: 'Illustration',
    rating: 4.8,
    hourlyRate: 80,
    skills: ['Character Design', 'Digital Art', 'Procreate'],
  },
  {
    id: 't6',
    user: users[5],
    category: 'Writing',
    rating: 4.5,
    hourlyRate: 60,
    skills: ['Copywriting', 'SEO', 'Content Strategy'],
  },
];

export const recentSearches: string[] = [
  'UI Designer Dubai',
  'React Native Developer',
  'Brand Photographer',
  'Motion Graphics',
  'Logo Design',
];
