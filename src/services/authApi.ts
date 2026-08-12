import { User } from '../data/types';
import { AccountType } from '../context/AuthContext';
import { apiRequest } from '../lib/apiClient';

export interface ApiUser {
  id: string;
  email: string;
  accountType: AccountType;
  displayName: string;
  username: string;
  isVerified: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  ratingAvg: number;
  ratingCount: number;
  bio: string;
  title: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  phoneE164: string | null;
  phoneVerified: boolean;
  emailVerified: boolean;
  skills: string[];
  about?: {
    languages: Array<{
      id: string;
      name: string;
      level: string;
      flag?: string;
    }>;
    education: Array<{
      id: string;
      school: string;
      degree: string;
      field: string;
      years: string;
      gpa?: string;
      description?: string;
      logoColor?: string;
    }>;
    experience: Array<{
      id: string;
      title: string;
      company: string;
      type: string;
      years: string;
      description: string;
      logoColor?: string;
    }>;
    certifications: Array<{
      id: string;
      name: string;
      org: string;
      year: string;
    }>;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface BootstrapPayload {
  accountType: AccountType;
  displayName: string;
  username?: string;
  locationCity?: string;
  email?: string;
  phoneE164?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

export interface UpdateMePayload {
  displayName?: string;
  username?: string;
  title?: string | null;
  bio?: string;
  locationCity?: string | null;
  locationCountry?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  skills?: string[];
  phoneE164?: string | null;
  phoneVerified?: boolean;
  emailVerified?: boolean;
}

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop';

export function mapApiUserToUser(api: ApiUser): User {
  return {
    id: api.id,
    name: api.displayName,
    username: api.username,
    avatar: api.avatarUrl || FALLBACK_AVATAR,
    coverImage: api.coverUrl || undefined,
    bio: api.bio,
    location: [api.locationCity, api.locationCountry].filter(Boolean).join(', ') || undefined,
    skills: api.skills,
    followers: api.followersCount,
    following: api.followingCount,
    posts: api.postsCount,
    isVerified: api.isVerified,
    title: api.title || undefined,
    rating: api.ratingAvg,
    reviewCount: api.ratingCount,
  };
}

export const authApi = {
  bootstrap(payload: BootstrapPayload, accessToken?: string): Promise<ApiUser> {
    return apiRequest<ApiUser>('/auth/bootstrap', {
      method: 'POST',
      body: JSON.stringify(payload),
      accessToken,
    });
  },

  getMe(accessToken?: string): Promise<ApiUser> {
    return apiRequest<ApiUser>('/users/me', { accessToken });
  },

  getById(userId: string): Promise<ApiUser> {
    return apiRequest<ApiUser>(`/users/${userId}`);
  },

  updateMe(payload: UpdateMePayload, accessToken?: string): Promise<ApiUser> {
    return apiRequest<ApiUser>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
      accessToken,
    });
  },
};
