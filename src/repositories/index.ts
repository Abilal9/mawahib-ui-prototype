/**
 * Repository wiring — currently all mock.
 * Swap mock*Repository imports for Supabase/API implementations later;
 * services and contexts should keep depending on these exports only.
 */

export type {
  UserRepository,
  PostRepository,
  JobListingRepository,
  UserJobRepository,
  MessageRepository,
  NotificationRepository,
  ProfileRepository,
  ReviewRepository,
  ConnectionRepository,
  CatalogRepository,
  CreatePostInput,
} from './types';

export { mockUserRepository } from './mock/mockUserRepository';
export { mockPostRepository } from './mock/mockPostRepository';
export { mockJobListingRepository } from './mock/mockJobListingRepository';
export { mockUserJobRepository } from './mock/mockUserJobRepository';
export { mockMessageRepository } from './mock/mockMessageRepository';
export { mockNotificationRepository } from './mock/mockNotificationRepository';
export { mockProfileRepository } from './mock/mockProfileRepository';
export { mockReviewRepository } from './mock/mockReviewRepository';
export { mockConnectionRepository } from './mock/mockConnectionRepository';
export { mockCatalogRepository } from './mock/mockCatalogRepository';

import { mockUserRepository } from './mock/mockUserRepository';
import { mockPostRepository } from './mock/mockPostRepository';
import { mockJobListingRepository } from './mock/mockJobListingRepository';
import { mockUserJobRepository } from './mock/mockUserJobRepository';
import { mockMessageRepository } from './mock/mockMessageRepository';
import { mockNotificationRepository } from './mock/mockNotificationRepository';
import { mockProfileRepository } from './mock/mockProfileRepository';
import { mockReviewRepository } from './mock/mockReviewRepository';
import { mockConnectionRepository } from './mock/mockConnectionRepository';
import { mockCatalogRepository } from './mock/mockCatalogRepository';

/** Active repository instances (mock today). */
export const repositories = {
  users: mockUserRepository,
  posts: mockPostRepository,
  jobListings: mockJobListingRepository,
  userJobs: mockUserJobRepository,
  messages: mockMessageRepository,
  notifications: mockNotificationRepository,
  profile: mockProfileRepository,
  reviews: mockReviewRepository,
  connections: mockConnectionRepository,
  catalog: mockCatalogRepository,
};
