import { apiRequest, type AuthenticatedRequestPrincipal } from '../lib/apiClient';

export type MediaPurpose = 'avatar' | 'portfolio' | 'service' | 'message' | 'post' | 'cover' | 'work_request'
  | 'review';

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

type MediaRequestOpts = {
  principal?: AuthenticatedRequestPrincipal;
};

export const mediaApi = {
  createUploadSession(
    input: {
      purpose: MediaPurpose;
      mimeType: string;
      byteSize: number;
      fileName?: string;
      width?: number;
      height?: number;
    },
    opts: MediaRequestOpts = {},
  ): Promise<UploadSession> {
    return apiRequest<UploadSession>('/media/upload-sessions', {
      method: 'POST',
      body: JSON.stringify(input),
      principal: opts.principal,
    });
  },

  completeUpload(
    mediaAssetId: string,
    opts: MediaRequestOpts = {},
  ): Promise<MediaAsset> {
    return apiRequest<MediaAsset>(`/media/${mediaAssetId}/complete`, {
      method: 'POST',
      principal: opts.principal,
    });
  },
};
