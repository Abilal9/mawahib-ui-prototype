import { Service } from '../types';
import { currentUser, users } from './users';

export const services: Service[] = [
  {
    id: 'sv1',
    title: 'Designing Dashboards',
    description:
      'Amet minim mollit non deserunt ullamco est sit Amet minim mollit non deserunt ullamco est sit',
    price: 25,
    currency: 'SAR',
    priceLabel: '25 / hour',
    duration: '3 days delivery',
    category: 'Design',
    exploreTag: 'Design',
    provider: {
      ...users[4],
      name: 'Faisal Al Saud',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
    },
    rating: 4.0,
    reviewCount: 1880,
    images: [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop',
    ],
  },
  {
    id: 'sv2',
    title: 'Brand Identity Design',
    description:
      'Complete brand identity package including logo, color palette, typography, and brand guidelines.',
    price: 2500,
    currency: 'AED',
    priceLabel: '2,500',
    duration: '2-3 weeks delivery',
    category: 'Design',
    exploreTag: 'Design',
    provider: currentUser,
    rating: 4.9,
    reviewCount: 47,
    images: ['https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=500&fit=crop'],
  },
  {
    id: 'sv3',
    title: 'Event Photography',
    description:
      'Professional coverage for corporate and private events with edited high-resolution photos.',
    price: 800,
    currency: 'AED',
    priceLabel: '800 / event',
    duration: '5 days delivery',
    category: 'Photography',
    exploreTag: 'Photography',
    provider: users[2],
    rating: 5.0,
    reviewCount: 89,
    images: ['https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=500&fit=crop'],
  },
  {
    id: 'sv4',
    title: 'React Native Development',
    description:
      'Custom mobile app development including backend integration and store deployment.',
    price: 5000,
    currency: 'AED',
    priceLabel: '5,000',
    duration: '4-6 weeks delivery',
    category: 'Development',
    exploreTag: 'Development',
    provider: users[1],
    rating: 4.7,
    reviewCount: 24,
    images: ['https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=500&fit=crop'],
  },
  {
    id: 'sv5',
    title: 'Motion Graphics Reel',
    description: 'Animated social and brand motion packages for campaigns and launches.',
    price: 1200,
    currency: 'AED',
    priceLabel: '1,200',
    duration: '3-5 days delivery',
    category: 'Video',
    exploreTag: 'Video',
    provider: users[3],
    rating: 4.6,
    reviewCount: 18,
    images: ['https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&h=500&fit=crop'],
  },
];

export const getServiceById = (id: string): Service | undefined =>
  services.find((s) => s.id === id);
