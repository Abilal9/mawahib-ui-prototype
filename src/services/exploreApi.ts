import { Job, Service, Talent, User } from '../data/types';
import { apiRequest } from '../lib/apiClient';
import { formatMoneyDisplay } from '../data/location/geo';
import { mapApiListingToJob, marketplaceApi } from './marketplaceApi';

export interface ExploreProfile {
  id: string;
  displayName: string;
  username: string;
  accountType: string;
  isVerified: boolean;
  title: string | null;
  bio: string;
  locationCity: string | null;
  locationCountry: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  skills: string[];
  followersCount: number;
  followingCount: number;
  postsCount: number;
  ratingAvg: number;
  ratingCount: number;
}

export interface ExploreServiceRow {
  id: string;
  title: string;
  description: string;
  category: string | null;
  price: number;
  currency: string;
  duration: string;
  rating: number;
  reviewCount: number;
  images: string[];
  exploreTag: string | null;
  provider: ExploreProfile;
}

function profileToUser(p: ExploreProfile): User {
  return {
    id: p.id,
    name: p.displayName,
    username: p.username,
    avatar: p.avatarUrl || '',
    coverImage: p.coverUrl || undefined,
    bio: p.bio,
    location: [p.locationCity, p.locationCountry].filter(Boolean).join(', ') || undefined,
    skills: p.skills,
    followers: p.followersCount,
    following: p.followingCount,
    posts: p.postsCount,
    isVerified: p.isVerified,
    title: p.title || undefined,
    rating: p.ratingAvg,
    reviewCount: p.ratingCount,
  };
}

export function mapExploreTalent(p: ExploreProfile): Talent {
  const user = profileToUser(p);
  return {
    id: `talent-${p.id}`,
    user,
    category: p.title || p.skills[0] || 'Talent',
    rating: p.ratingAvg,
    reviewCount: p.ratingCount,
    hourlyRate: 0,
    rateLabel: p.accountType === 'business' ? 'Studio' : 'Available',
    skills: p.skills,
    mutualConnections: 0,
    mutualAvatars: [],
    connectStatus: 'connect',
    tags: p.skills.slice(0, 3),
  };
}

export function mapExploreService(row: ExploreServiceRow): Service {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: row.price,
    currency: row.currency,
    duration: row.duration,
    category: row.category || 'General',
    provider: profileToUser(row.provider),
    rating: row.rating,
    reviewCount: row.reviewCount,
    images: row.images,
    priceLabel: formatMoneyDisplay({
      amount: row.price,
      currency: row.currency,
    }),
    exploreTag: row.exploreTag || undefined,
  };
}

export const exploreApi = {
  listTalents(): Promise<ExploreProfile[]> {
    return apiRequest<ExploreProfile[]>('/explore/talents');
  },

  listBusinesses(): Promise<ExploreProfile[]> {
    return apiRequest<ExploreProfile[]>('/explore/businesses');
  },

  listServices(): Promise<ExploreServiceRow[]> {
    return apiRequest<ExploreServiceRow[]>('/explore/services');
  },

  async listOpenJobs(): Promise<Job[]> {
    const page = await marketplaceApi.listOpenListings({ take: 50 });
    return page.items.map(mapApiListingToJob);
  },
};
