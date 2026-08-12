import {
  User,
  Post,
  Comment,
  JobListing,
  CatalogService,
  Talent,
  Story,
  Conversation,
  Message,
  Notification,
  ProfileContent,
  ReviewsBundle,
  ConnectionRelation,
} from '../data/types';
import { UserJob } from '../data/types/userJobs';

/**
 * Repository interfaces — UI/services depend on these.
 * Mock implementations remain ONLY for domains without a Nest module yet
 * (posts, jobs, messages, notifications, connections, reviews, explore catalog).
 * Auth / profile / portfolio / services / media must not use these for identity.
 */

export interface UserRepository {
  getCurrent(): User;
  list(): User[];
  getById(id: string): User | undefined;
  resolveProfileUser(userId: string): User | undefined;
}

export interface CreatePostInput {
  author: User;
  caption: string;
  images?: string[];
}

export interface PostRepository {
  list(): Post[];
  getById(id: string): Post | undefined;
  create(input: CreatePostInput): Post;
  getComments(postId: string): Comment[];
  addComment(postId: string, comment: Omit<Comment, 'id'>): Comment;
}

export interface JobListingRepository {
  list(): JobListing[];
  getById(id: string): JobListing | undefined;
  create(listing: Omit<JobListing, 'id' | 'postedAt'> & { id?: string }): JobListing;
}

export interface UserJobRepository {
  list(): UserJob[];
  getById(id: string): UserJob | undefined;
  upsert(job: UserJob): void;
  replaceAll(jobs: UserJob[]): void;
}

export interface MessageRepository {
  listConversations(): Conversation[];
  getConversationById(id: string): Conversation | undefined;
  getMessages(conversationId: string): Message[];
}

export interface NotificationRepository {
  list(): Notification[];
  markRead(id: string): void;
  markAllRead(): void;
  unreadCount(): number;
  /** Clear Accept/Decline actions after handling */
  clearActions(id: string): void;
  /** Hide rating prompt after navigating to review */
  clearRatingPrompt(id: string): void;
  remove(id: string): void;
}

export interface ProfileRepository {
  getFilledContent(): ProfileContent;
  getEmptyContent(): ProfileContent;
  getVisitorContent(userId: string): ProfileContent;
  getSeedUser(): User;
}

export interface ReviewRepository {
  getForUser(userId?: string): ReviewsBundle;
}

export interface ConnectionRepository {
  getSeedConnectedIds(): string[];
  getSeedIncomingIds(selfId: string, connectedIds: string[]): string[];
  getConnectionsForUser(userId: string): User[];
  getConversationId(userId: string): string | undefined;
}

export interface CatalogRepository {
  listServices(): CatalogService[];
  getServiceById(id: string): CatalogService | undefined;
  listTalents(): Talent[];
  listStories(): Story[];
  getStoryById(id: string): Story | undefined;
}

export type { ConnectionRelation };
