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
  listMine(accessToken?: string): Promise<ApiPortfolioProject[]> {
    return apiRequest<ApiPortfolioProject[]>('/users/me/portfolio', {
      accessToken,
    });
  },

  listForUser(userId: string): Promise<ApiPortfolioProject[]> {
    return apiRequest<ApiPortfolioProject[]>(`/users/${userId}/portfolio`);
  },

  create(
    input: {
      title: string;
      description?: string;
      mediaAssetIds: string[];
    },
    accessToken?: string,
  ): Promise<ApiPortfolioProject> {
    return apiRequest<ApiPortfolioProject>('/users/me/portfolio', {
      method: 'POST',
      accessToken,
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
    accessToken?: string,
  ): Promise<ApiPortfolioProject> {
    return apiRequest<ApiPortfolioProject>(`/users/me/portfolio/${id}`, {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        media: input.mediaAssetIds?.map((mediaAssetId) => ({ mediaAssetId })),
      }),
    });
  },

  remove(id: string, accessToken?: string): Promise<void> {
    return apiRequest<void>(`/users/me/portfolio/${id}`, {
      method: 'DELETE',
      accessToken,
    });
  },

  reorder(
    projectIds: string[],
    accessToken?: string,
  ): Promise<ApiPortfolioProject[]> {
    return apiRequest<ApiPortfolioProject[]>('/users/me/portfolio/order', {
      method: 'PUT',
      accessToken,
      body: JSON.stringify({ projectIds }),
    });
  },
};
