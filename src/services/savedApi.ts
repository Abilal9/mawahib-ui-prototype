import { apiRequest } from '../lib/apiClient';
import { ApiFeedPage, ApiFeedPost } from './postsApi';
import { ApiJobListing } from './marketplaceApi';
import { ApiServiceOffering } from './servicesApi';

export interface SavedPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface SavedServiceItem extends ApiServiceOffering {
  userId?: string;
  ownerDisplayName?: string;
  ownerUsername?: string;
  ownerAvatarUrl?: string | null;
  ownerIsVerified?: boolean;
  isSaved?: boolean;
  savedAt?: string;
  status?: 'draft' | 'published' | 'archived';
}

export interface SavedJobItem extends ApiJobListing {
  isSaved?: boolean;
  savedAt?: string;
}

function savedFlag(body: { isSaved: boolean }): boolean {
  return body.isSaved;
}

async function page<T>(path: string, cursor?: string | null): Promise<SavedPage<T>> {
  const qs = new URLSearchParams();
  if (cursor) qs.set('cursor', cursor);
  qs.set('limit', '20');
  return apiRequest<SavedPage<T>>(`${path}?${qs.toString()}`);
}

export const savedApi = {
  savePost(id: string): Promise<boolean> {
    return apiRequest<{ isSaved: boolean }>(`/posts/${id}/saves`, {
      method: 'POST',
    }).then(savedFlag);
  },
  unsavePost(id: string): Promise<boolean> {
    return apiRequest<{ isSaved: boolean }>(`/posts/${id}/saves`, {
      method: 'DELETE',
    }).then(savedFlag);
  },
  listPosts(cursor?: string | null): Promise<SavedPage<ApiFeedPost>> {
    return page('/saved/posts', cursor);
  },
  saveJob(id: string): Promise<boolean> {
    return apiRequest<{ isSaved: boolean }>(`/job-listings/${id}/saves`, {
      method: 'POST',
    }).then(savedFlag);
  },
  unsaveJob(id: string): Promise<boolean> {
    return apiRequest<{ isSaved: boolean }>(`/job-listings/${id}/saves`, {
      method: 'DELETE',
    }).then(savedFlag);
  },
  listJobs(cursor?: string | null): Promise<SavedPage<SavedJobItem>> {
    return page('/saved/jobs', cursor);
  },
  saveService(id: string): Promise<boolean> {
    return apiRequest<{ isSaved: boolean }>(`/services/${id}/saves`, {
      method: 'POST',
    }).then(savedFlag);
  },
  unsaveService(id: string): Promise<boolean> {
    return apiRequest<{ isSaved: boolean }>(`/services/${id}/saves`, {
      method: 'DELETE',
    }).then(savedFlag);
  },
  listServices(cursor?: string | null): Promise<SavedPage<SavedServiceItem>> {
    return page('/saved/services', cursor);
  },
};
