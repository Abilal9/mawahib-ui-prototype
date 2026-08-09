/**
 * Service layer — UI/contexts call these; services call repositories.
 * Mock repositories are wired today; swap repository implementations for Supabase later
 * without changing screen code.
 */

export { postService } from './postService';
export { userService } from './userService';
export { jobService } from './jobService';
export { messageService } from './messageService';
export { notificationService } from './notificationService';
export { profileService } from './profileService';
export { reviewService } from './reviewService';
export { connectionService } from './connectionService';
export { catalogService } from './catalogService';
