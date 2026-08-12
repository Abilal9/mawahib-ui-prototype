import { PortfolioProject } from '../data/types';
import { apiRequest } from '../lib/apiClient';

export interface ApiPortfolioProject {
  id: string;
  title: string;
  description: string;
  images: string[];
  mediaAssetIds: string[];
  hasVideo: boolean;
  videoIndex?: number;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export function mapPortfolioProject(api: ApiPortfolioProject): PortfolioProject {
  return {
    id: api.id,
    title: api.title,
    description: api.description,
    images: api.images,
    mediaAssetIds: api.mediaAssetIds,
    hasVideo: api.hasVideo,
    videoIndex: api.videoIndex,
  };
}

export const portfolioApi = {
  listMine(): Promise<ApiPortfolioProject[]> {
    return apiRequest<ApiPortfolioProject[]>('/users/me/portfolio');
  },

  listForUser(userId: string): Promise<ApiPortfolioProject[]> {
    return apiRequest<ApiPortfolioProject[]>(`/users/${userId}/portfolio`);
  },

  create(input: {
    title: string;
    description?: string;
    mediaAssetIds: string[];
  }): Promise<ApiPortfolioProject> {
    return apiRequest<ApiPortfolioProject>('/users/me/portfolio', {
      method: 'POST',
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        media: input.mediaAssetIds.map((mediaAssetId) => ({ mediaAssetId })),
      }),
    });
  },

  update(
    id: string,
    input: {
      title?: string;
      description?: string;
      mediaAssetIds?: string[];
    },
  ): Promise<ApiPortfolioProject> {
    return apiRequest<ApiPortfolioProject>(`/users/me/portfolio/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        media: input.mediaAssetIds?.map((mediaAssetId) => ({ mediaAssetId })),
      }),
    });
  },

  remove(id: string): Promise<void> {
    return apiRequest<void>(`/users/me/portfolio/${id}`, { method: 'DELETE' });
  },

  reorder(projectIds: string[]): Promise<ApiPortfolioProject[]> {
    return apiRequest<ApiPortfolioProject[]>('/users/me/portfolio/order', {
      method: 'PUT',
      body: JSON.stringify({ projectIds }),
    });
  },
};
