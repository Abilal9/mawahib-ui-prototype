import { apiRequest } from '../lib/apiClient';

export type ConnectionRequestStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled';

export interface ConnectionUserSummary {
  id: string;
  displayName: string;
  username: string;
  isVerified: boolean;
  avatarUrl: string | null;
  title: string | null;
}

export interface ApiConnectionRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: ConnectionRequestStatus;
  message: string;
  createdAt: string;
  updatedAt: string;
  fromUser: ConnectionUserSummary;
  toUser: ConnectionUserSummary;
}

export interface ApiConnection {
  id: string;
  userId: string;
  peer: ConnectionUserSummary;
  createdAt: string;
  updatedAt: string;
  /** Present if the backend includes it; otherwise resolve via messagingApi. */
  conversationId?: string | null;
}

export type ConnectionRequestDirection = 'incoming' | 'outgoing' | 'all';

export const connectionsApi = {
  createRequest(input: {
    toUserId: string;
    message?: string;
  }): Promise<ApiConnectionRequest> {
    return apiRequest<ApiConnectionRequest>('/connection-requests', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  listRequests(
    direction: ConnectionRequestDirection = 'all',
  ): Promise<ApiConnectionRequest[]> {
    const qs = new URLSearchParams({ direction });
    return apiRequest<ApiConnectionRequest[]>(
      `/users/me/connection-requests?${qs.toString()}`,
    );
  },

  accept(requestId: string): Promise<ApiConnection> {
    return apiRequest<ApiConnection>(
      `/connection-requests/${requestId}/accept`,
      { method: 'POST' },
    );
  },

  reject(requestId: string): Promise<void> {
    return apiRequest<void>(`/connection-requests/${requestId}/reject`, {
      method: 'POST',
    });
  },

  cancel(requestId: string): Promise<void> {
    return apiRequest<void>(`/connection-requests/${requestId}/cancel`, {
      method: 'POST',
    });
  },

  listConnections(): Promise<ApiConnection[]> {
    return apiRequest<ApiConnection[]>('/users/me/connections');
  },

  disconnect(peerUserId: string): Promise<void> {
    return apiRequest<void>(`/users/me/connections/${peerUserId}`, {
      method: 'DELETE',
    });
  },

  /** Creates (or returns) the connection conversation for a connected peer. */
  openConversation(
    peerUserId: string,
  ): Promise<{ conversationId: string }> {
    return apiRequest<{ conversationId: string }>(
      `/users/me/connections/${peerUserId}/conversation`,
      { method: 'POST' },
    );
  },
};
