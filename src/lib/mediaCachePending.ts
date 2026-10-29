/**
 * Durable marker that an explicit media-cache cleanup was interrupted.
 * Implementation lives in mediaCacheOwner.ts so Node selftests can import
 * one leaf module.
 */

export {
  clearMediaCacheClearPending,
  markMediaCacheClearPending,
  readMediaCacheClearPending,
} from './mediaCacheOwner';
