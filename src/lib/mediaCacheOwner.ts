/**
 * Durable Expo image-cache ownership and interrupted-cleanup marker.
 * No local imports so Node selftests can execute this module directly.
 * Storage follows the same localStorage convention as pendingSignup.
 */

export type MediaCacheOwner = `user:${string}` | 'guest';

const OWNER_KEY = 'mawahib.mediaCacheOwner.v1';
const PENDING_KEY = 'mawahib.mediaCacheClearPending.v1';

export class MediaCacheOwnerError extends Error {
  readonly code: 'OWNER_READ' | 'OWNER_WRITE';

  constructor(code: 'OWNER_READ' | 'OWNER_WRITE', message: string) {
    super(message);
    this.name = 'MediaCacheOwnerError';
    this.code = code;
  }
}

function storageAvailable(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export function mediaCacheOwnerFromUserId(
  userId: string | null | undefined,
): MediaCacheOwner {
  return userId ? `user:${userId}` : 'guest';
}

export function parseMediaCacheOwner(raw: string | null): MediaCacheOwner | null {
  if (!raw) return null;
  if (raw === 'guest') return 'guest';
  if (raw.startsWith('user:') && raw.length > 5) return raw as `user:${string}`;
  return null;
}

/**
 * In-memory helper used by the performance selftest.
 * Missing previous owner does not clear. A→B and A→signed-out do.
 * Durable reconcile uses `ownersRequireCacheClear` instead.
 */
export function shouldClearMediaImageCache(
  previousUserId: string | null | undefined,
  nextUserId: string | null,
): boolean {
  if (previousUserId == null || previousUserId === '') return false;
  return previousUserId !== nextUserId;
}

export function ownersRequireCacheClear(
  stored: MediaCacheOwner | null,
  current: MediaCacheOwner,
): boolean {
  if (stored == null) return false;
  return stored !== current;
}

export function readMediaCacheOwner():
  | { ok: true; owner: MediaCacheOwner | null }
  | { ok: false } {
  if (!storageAvailable()) return { ok: false };
  try {
    const raw = localStorage.getItem(OWNER_KEY);
    if (raw == null) return { ok: true, owner: null };
    const owner = parseMediaCacheOwner(raw);
    if (!owner) return { ok: false };
    return { ok: true, owner };
  } catch {
    return { ok: false };
  }
}

export function writeMediaCacheOwner(
  owner: MediaCacheOwner,
): { ok: true } | { ok: false } {
  if (!storageAvailable()) return { ok: false };
  try {
    localStorage.setItem(OWNER_KEY, owner);
    const verify = localStorage.getItem(OWNER_KEY);
    if (verify !== owner) return { ok: false };
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function clearMediaCacheOwner(): { ok: true } | { ok: false } {
  if (!storageAvailable()) return { ok: false };
  try {
    localStorage.removeItem(OWNER_KEY);
    if (localStorage.getItem(OWNER_KEY) != null) return { ok: false };
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function readMediaCacheClearPending():
  | { ok: true; pending: boolean }
  | { ok: false } {
  if (!storageAvailable()) return { ok: false };
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return { ok: true, pending: raw === 'true' };
  } catch {
    return { ok: false };
  }
}

export function markMediaCacheClearPending(): { ok: true } | { ok: false } {
  if (!storageAvailable()) return { ok: false };
  try {
    localStorage.setItem(PENDING_KEY, 'true');
    if (localStorage.getItem(PENDING_KEY) !== 'true') return { ok: false };
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function clearMediaCacheClearPending(): { ok: true } | { ok: false } {
  if (!storageAvailable()) return { ok: false };
  try {
    localStorage.removeItem(PENDING_KEY);
    if (localStorage.getItem(PENDING_KEY) != null) return { ok: false };
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export type MediaCacheReconcileResult =
  | { ok: true; owner: MediaCacheOwner; cleared: boolean }
  | {
      ok: false;
      reason: 'owner-write' | 'cache-clear' | 'superseded';
    };

export type ReconcileMediaCacheInput = {
  current: MediaCacheOwner;
  clearCache: () => Promise<void>;
};

let reconcileGeneration = 0;
let reconcileTail: Promise<void> = Promise.resolve();

/**
 * Establish durable cache ownership for `current` before any media fetch.
 * Fail closed: never reports ready when the owner is unestablished or the
 * cache may still belong to someone else.
 *
 * Reconciles are serialized. A run that is no longer the latest principal
 * must not write owner or clear the pending marker after its await.
 */
export async function reconcileMediaCacheOwner(
  input: ReconcileMediaCacheInput,
): Promise<MediaCacheReconcileResult> {
  const myGen = ++reconcileGeneration;
  let result: MediaCacheReconcileResult = {
    ok: false,
    reason: 'superseded',
  };
  const run = reconcileTail.then(async () => {
    result = await reconcileMediaCacheOwnerUnlocked(input, myGen);
  });
  reconcileTail = run.then(
    () => undefined,
    () => undefined,
  );
  await run;
  return result;
}

async function reconcileMediaCacheOwnerUnlocked(
  input: ReconcileMediaCacheInput,
  myGen: number,
): Promise<MediaCacheReconcileResult> {
  if (myGen !== reconcileGeneration) {
    return { ok: false, reason: 'superseded' };
  }

  const pendingRead = readMediaCacheClearPending();
  const pending = pendingRead.ok ? pendingRead.pending : true;
  const ownerRead = readMediaCacheOwner();
  const stored = ownerRead.ok ? ownerRead.owner : null;
  const unreadableOwner = !ownerRead.ok;
  // Missing owner + signed-out: do not assume the disk cache is empty.
  // Covers first Phase B launch after an in-memory-only process, and owner
  // writes that never landed. Missing + authenticated A still establishes
  // without a clear (same principal, first install / upgrade while signed in).
  const unknownSignedOutCache =
    ownerRead.ok && stored == null && input.current === 'guest';
  const needClear =
    pending ||
    unreadableOwner ||
    unknownSignedOutCache ||
    ownersRequireCacheClear(stored, input.current);

  if (!needClear) {
    if (stored === input.current) {
      return { ok: true, owner: input.current, cleared: false };
    }
    if (!writeMediaCacheOwner(input.current).ok) {
      return { ok: false, reason: 'owner-write' };
    }
    return { ok: true, owner: input.current, cleared: false };
  }

  if (!pending) {
    markMediaCacheClearPending();
  }

  try {
    await input.clearCache();
  } catch {
    return { ok: false, reason: 'cache-clear' };
  }

  if (myGen !== reconcileGeneration) {
    return { ok: false, reason: 'superseded' };
  }

  if (!writeMediaCacheOwner(input.current).ok) {
    return { ok: false, reason: 'owner-write' };
  }

  clearMediaCacheClearPending();
  return { ok: true, owner: input.current, cleared: true };
}
