import { ServiceOffering, ServicePackage } from '../data/types';
import { apiRequest } from '../lib/apiClient';

export interface ApiServiceOffering {
  id: string;
  title: string;
  description: string;
  category: string | null;
  currency: string;
  rating: number;
  reviewCount: number;
  images: string[];
  mediaAssetIds: string[];
  packages: Array<{
    name: 'Basic' | 'Standard' | 'Premium';
    priceLabel: string;
    delivery: string;
    includes: string[];
    price: number;
    currency: string;
  }>;
  addons: Array<{
    id: string;
    title: string;
    priceLabel: string;
    price: number;
    currency: string;
  }>;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export function mapServiceOffering(api: ApiServiceOffering): ServiceOffering {
  return {
    id: api.id,
    title: api.title,
    description: api.description,
    rating: api.rating,
    reviewCount: api.reviewCount,
    images: api.images,
    mediaAssetIds: api.mediaAssetIds,
    currency: api.currency,
    packages: api.packages.map(
      (p): ServicePackage => ({
        name: p.name,
        price: p.price,
        currency: p.currency,
        priceLabel: p.priceLabel,
        delivery: p.delivery,
        includes: p.includes,
      }),
    ),
    addons: api.addons.map((a) => ({
      id: a.id,
      title: a.title,
      price: a.price,
      currency: a.currency,
      priceLabel: a.priceLabel,
    })),
  };
}

const TIER_API: Record<ServicePackage['name'], 'basic' | 'standard' | 'premium'> =
  {
    Basic: 'basic',
    Standard: 'standard',
    Premium: 'premium',
  };

export const servicesApi = {
  listMine(): Promise<ApiServiceOffering[]> {
    return apiRequest<ApiServiceOffering[]>('/users/me/services');
  },

  listForUser(userId: string): Promise<ApiServiceOffering[]> {
    return apiRequest<ApiServiceOffering[]>(`/users/${userId}/services`);
  },

  create(input: {
    title: string;
    description?: string;
    mediaAssetIds: string[];
    packages: Array<{
      name: ServicePackage['name'];
      price: number;
      deliveryLabel: string;
      includes: string[];
    }>;
    addons?: Array<{ title: string; price: number }>;
  }): Promise<ApiServiceOffering> {
    return apiRequest<ApiServiceOffering>('/users/me/services', {
      method: 'POST',
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        media: input.mediaAssetIds.map((mediaAssetId) => ({ mediaAssetId })),
        packages: input.packages.map((p) => ({
          tier: TIER_API[p.name],
          price: p.price,
          deliveryLabel: p.deliveryLabel,
          includes: p.includes,
        })),
        addons: input.addons,
      }),
    });
  },

  update(
    id: string,
    input: {
      title?: string;
      description?: string;
      mediaAssetIds?: string[];
      packages?: Array<{
        name: ServicePackage['name'];
        price: number;
        deliveryLabel: string;
        includes: string[];
      }>;
      addons?: Array<{ title: string; price: number }>;
    },
  ): Promise<ApiServiceOffering> {
    return apiRequest<ApiServiceOffering>(`/users/me/services/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        media: input.mediaAssetIds?.map((mediaAssetId) => ({ mediaAssetId })),
        packages: input.packages?.map((p) => ({
          tier: TIER_API[p.name],
          price: p.price,
          deliveryLabel: p.deliveryLabel,
          includes: p.includes,
        })),
        addons: input.addons,
      }),
    });
  },

  remove(id: string): Promise<void> {
    return apiRequest<void>(`/users/me/services/${id}`, { method: 'DELETE' });
  },

  reorder(serviceIds: string[]): Promise<ApiServiceOffering[]> {
    return apiRequest<ApiServiceOffering[]>('/users/me/services/order', {
      method: 'PUT',
      body: JSON.stringify({ serviceIds }),
    });
  },
};
