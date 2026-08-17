import { apiRequest } from '../lib/apiClient';

export type MediaPurpose = 'avatar' | 'portfolio' | 'service' | 'message';

export interface UploadSession {
  mediaAssetId: string;
  bucket: string;
  objectKey: string;
  uploadUrl: string;
  token: string;
  purpose: string;
  mimeType: string;
  byteSize: number;
}

export interface MediaAsset {
  id: string;
  bucket: string;
  objectKey: string;
  mimeType: string;
  byteSize: number;
  purpose: string;
  status: string;
  url: string | null;
  createdAt: string;
}

export const mediaApi = {
  createUploadSession(input: {
    purpose: MediaPurpose;
    mimeType: string;
    byteSize: number;
    fileName?: string;
  }): Promise<UploadSession> {
    return apiRequest<UploadSession>('/media/upload-sessions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  completeUpload(mediaAssetId: string): Promise<MediaAsset> {
    return apiRequest<MediaAsset>(`/media/${mediaAssetId}/complete`, {
      method: 'POST',
    });
  },
};
