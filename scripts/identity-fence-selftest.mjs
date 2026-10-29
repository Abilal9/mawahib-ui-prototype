/**
 * Phase A identity fences: principal capture, token refresh, pre-dispatch,
 * post-body final fence, 401 GET retry, no mutation retry, recovery exclusion.
 * Run: node --no-warnings --experimental-strip-types scripts/identity-fence-selftest.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ACCOUNT_SUSPENDED_CODE,
  MAWAHIB_PROFILE_MISSING_CODE,
  ApiError,
  isMawahibProfileMissingError,
  acquireAuthenticatedToken,
  consumeResponseBody,
  executeAuthenticatedRequest,
  executePublicRequest,
  isStaleIdentityError,
  StaleIdentityError,
} from '../src/lib/identityFences.ts';
import {
  guestIdentityId,
  shouldIgnoreStaleIdentityResult,
} from '../src/context/identityGuard.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

function jwt(sub) {
  const payload = Buffer.from(JSON.stringify({ sub })).toString('base64url');
  return `hdr.${payload}.sig`;
}

function jsonResponse(status, body) {
  const text = body === undefined ? '' : JSON.stringify(body);
  return {
    status,
    ok: status >= 200 && status < 300,
    text: async () => text,
  };
}

function switchingResponse(status, body, onRead) {
  return {
    status,
    ok: status >= 200 && status < 300,
    text: async () => {
      onRead();
      return body === undefined ? '' : JSON.stringify(body);
    },
  };
}

function makeWorld(userId, epoch) {
  const world = {
    userId,
    epoch,
    recovery: false,
    getSessionCalls: 0,
    refreshCalls: 0,
    sessionUserId: userId,
    token: jwt(userId),
    refreshToken: jwt(userId),
  };
  return world;
}

function depsFrom(world, fetchImpl, extras = {}) {
  const principal = { userId: world.userId, epoch: world.epoch };
  const current = () =>
    world.recovery
      ? null
      : { userId: world.sessionUserId, epoch: world.epoch };
  return {
    principal,
    isRecoveryActive: () => world.recovery,
    isPrincipalCurrent: (snap) => {
      const now = current();
      return Boolean(
        now && now.userId === snap.userId && now.epoch === snap.epoch,
      );
    },
    getAuthenticatedToken: (snap, options) =>
      acquireAuthenticatedToken({
        principal: snap,
        preferredToken: options?.preferredToken,
        forceRefresh: options?.forceRefresh,
        isRecoveryActive: () => world.recovery,
        currentPrincipal: current,
        getSession: async () => {
          world.getSessionCalls += 1;
          if (extras.onGetSession) extras.onGetSession();
          return {
            user: { id: world.sessionUserId },
            access_token: world.token,
          };
        },
        refreshSession: async () => {
          world.refreshCalls += 1;
          if (extras.onRefresh) extras.onRefresh();
          return {
            user: { id: world.sessionUserId },
            access_token: world.refreshToken,
          };
        },
      }),
    fetch: fetchImpl,
    apiBaseUrl: 'https://api.test/api/v1',
    onAccountSuspended: extras.onAccountSuspended,
  };
}

// --- Success body accepted when identity is stable ---
{
  const world = makeWorld('user-a', 1);
  let fetches = 0;
  const result = await executeAuthenticatedRequest(
    '/users/me',
    {},
    depsFrom(world, async () => {
      fetches += 1;
      return jsonResponse(200, { id: 'user-a' });
    }),
  );
  assert.equal(fetches, 1);
  assert.deepEqual(result, { id: 'user-a' });
}

// --- Identity changes before dispatch: abort, no send ---
{
  const world = makeWorld('user-a', 1);
  world.sessionUserId = 'user-b';
  world.epoch = 2;
  let fetches = 0;
  await assert.rejects(
    () =>
      executeAuthenticatedRequest(
        '/users/me',
        { principal: { userId: 'user-a', epoch: 1 } },
        {
          ...depsFrom(world, async () => {
            fetches += 1;
            return jsonResponse(200, { leaked: true });
          }),
          principal: { userId: 'user-a', epoch: 1 },
        },
      ),
    StaleIdentityError,
  );
  assert.equal(fetches, 0);
}

// --- Identity changes while token refresh awaits: never use B token ---
{
  const world = makeWorld('user-a', 1);
  let fetches = 0;
  const seenAuth = [];
  await assert.rejects(
    () =>
      executeAuthenticatedRequest(
        '/users/me',
        {},
        depsFrom(
          world,
          async (_url, init) => {
            fetches += 1;
            seenAuth.push(init.headers.get('Authorization'));
            return jsonResponse(200, { id: 'user-b' });
          },
          {
            onGetSession: () => {
              world.sessionUserId = 'user-b';
              world.epoch += 1;
              world.token = jwt('user-b');
            },
          },
        ),
      ),
    StaleIdentityError,
  );
  assert.equal(fetches, 0);
  assert.equal(seenAuth.length, 0);
}

// --- Identity changes after headers, during body parse: drop success ---
{
  const world = makeWorld('user-a', 1);
  let applied = false;
  await assert.rejects(async () => {
    const value = await executeAuthenticatedRequest(
      '/users/me',
      {},
      depsFrom(world, async () =>
        switchingResponse(200, { secret: 'a-private' }, () => {
          world.sessionUserId = 'user-b';
          world.epoch += 1;
        }),
      ),
    );
    applied = value != null;
  }, StaleIdentityError);
  assert.equal(applied, false);
}

// --- 204 still runs the final fence ---
{
  const world = makeWorld('user-a', 1);
  await assert.rejects(
    () =>
      executeAuthenticatedRequest(
        '/users/me/connections/x',
        { method: 'DELETE' },
        depsFrom(world, async () =>
          switchingResponse(204, undefined, () => {
            world.sessionUserId = 'user-b';
            world.epoch += 1;
          }),
        ),
      ),
    StaleIdentityError,
  );
}

{
  const world = makeWorld('user-a', 1);
  const result = await executeAuthenticatedRequest(
    '/users/me/connections/x',
    { method: 'DELETE' },
    depsFrom(world, async () => jsonResponse(204)),
  );
  assert.equal(result, undefined);
}

// --- Error body ACCOUNT_SUSPENDED does not notify the new identity ---
{
  const world = makeWorld('user-a', 1);
  let notified = 0;
  await assert.rejects(
    () =>
      executeAuthenticatedRequest(
        '/users/me',
        {},
        depsFrom(
          world,
          async () =>
            switchingResponse(
              403,
              { message: 'Suspended', code: ACCOUNT_SUSPENDED_CODE },
              () => {
                world.sessionUserId = 'user-b';
                world.epoch += 1;
              },
            ),
          { onAccountSuspended: () => { notified += 1; } },
        ),
      ),
    StaleIdentityError,
  );
  assert.equal(notified, 0);
}

{
  const world = makeWorld('user-a', 1);
  let notified = 0;
  await assert.rejects(
    () =>
      executeAuthenticatedRequest(
        '/users/me',
        {},
        depsFrom(
          world,
          async () =>
            jsonResponse(403, {
              message: 'Suspended',
              code: ACCOUNT_SUSPENDED_CODE,
            }),
          { onAccountSuspended: () => { notified += 1; } },
        ),
      ),
    (err) =>
      err instanceof ApiError &&
      err.status === 403 &&
      err.code === ACCOUNT_SUSPENDED_CODE,
  );
  assert.equal(notified, 1);
}

// --- GET 401 → one refresh/retry; second 401 does not loop ---
{
  const world = makeWorld('user-a', 1);
  const statuses = [401, 401];
  let fetches = 0;
  await assert.rejects(
    () =>
      executeAuthenticatedRequest(
        '/users/me',
        { method: 'GET' },
        depsFrom(world, async () => {
          fetches += 1;
          return jsonResponse(statuses.shift() ?? 401, { message: 'expired' });
        }),
      ),
    (err) => err instanceof ApiError && err.status === 401,
  );
  assert.equal(fetches, 2);
  assert.equal(world.refreshCalls, 1);
}

{
  const world = makeWorld('user-a', 1);
  let fetches = 0;
  await assert.rejects(
    () =>
      executeAuthenticatedRequest(
        '/users/me',
        { method: 'GET' },
        depsFrom(world, async () => {
          fetches += 1;
          return jsonResponse(401, {
            message: 'Mawahib profile is missing.',
            code: MAWAHIB_PROFILE_MISSING_CODE,
          });
        }),
      ),
    (err) => isMawahibProfileMissingError(err),
  );
  assert.equal(fetches, 1);
  assert.equal(world.refreshCalls, 0);
}

{
  const world = makeWorld('user-a', 1);
  const statuses = [401, 200];
  let fetches = 0;
  const result = await executeAuthenticatedRequest(
    '/feed',
    {},
    depsFrom(world, async () => {
      fetches += 1;
      const status = statuses.shift();
      return jsonResponse(status, status === 200 ? { items: [] } : { message: 'expired' });
    }),
  );
  assert.equal(fetches, 2);
  assert.equal(world.refreshCalls, 1);
  assert.deepEqual(result, { items: [] });
}

// --- GET 401 retry aborts if identity changes ---
{
  const world = makeWorld('user-a', 1);
  let fetches = 0;
  await assert.rejects(
    () =>
      executeAuthenticatedRequest(
        '/users/me',
        {},
        depsFrom(
          world,
          async () => {
            fetches += 1;
            return jsonResponse(401, { message: 'expired' });
          },
          {
            onRefresh: () => {
              world.sessionUserId = 'user-b';
              world.epoch += 1;
              world.refreshToken = jwt('user-b');
            },
          },
        ),
      ),
    StaleIdentityError,
  );
  assert.equal(fetches, 1);
}

// --- Mutation 401 is not retried ---
{
  const world = makeWorld('user-a', 1);
  let fetches = 0;
  await assert.rejects(
    () =>
      executeAuthenticatedRequest(
        '/posts/1/likes',
        { method: 'POST' },
        depsFrom(world, async () => {
          fetches += 1;
          return jsonResponse(401, { message: 'expired' });
        }),
      ),
    (err) => err instanceof ApiError && err.status === 401,
  );
  assert.equal(fetches, 1);
  assert.equal(world.refreshCalls, 0);
}

// --- Recovery cannot obtain a Nest token ---
{
  const world = makeWorld('user-a', 1);
  world.recovery = true;
  await assert.rejects(
    () =>
      acquireAuthenticatedToken({
        principal: { userId: 'user-a', epoch: 1 },
        preferredToken: jwt('user-a'),
        isRecoveryActive: () => true,
        currentPrincipal: () => ({ userId: 'user-a', epoch: 1 }),
        getSession: async () => {
          throw new Error('getSession must not run in recovery');
        },
        refreshSession: async () => {
          throw new Error('refreshSession must not run in recovery');
        },
      }),
    StaleIdentityError,
  );
}

{
  const world = makeWorld('user-a', 1);
  world.recovery = true;
  let fetches = 0;
  await assert.rejects(
    () =>
      executeAuthenticatedRequest(
        '/users/me',
        { accessToken: jwt('user-a') },
        depsFrom(world, async () => {
          fetches += 1;
          return jsonResponse(200, { id: 'user-a' });
        }),
      ),
    StaleIdentityError,
  );
  assert.equal(fetches, 0);
}

// --- Preferred token for A is rejected if session is B ---
{
  await assert.rejects(
    () =>
      acquireAuthenticatedToken({
        principal: { userId: 'user-a', epoch: 1 },
        preferredToken: jwt('user-a'),
        isRecoveryActive: () => false,
        currentPrincipal: () => ({ userId: 'user-b', epoch: 2 }),
        getSession: async () => ({
          user: { id: 'user-b' },
          access_token: jwt('user-b'),
        }),
        refreshSession: async () => null,
      }),
    StaleIdentityError,
  );
}

// --- Guest identity ids are not automatically stale ---
assert.equal(
  shouldIgnoreStaleIdentityResult({
    startedUserId: guestIdentityId(3),
    currentUserId: guestIdentityId(3),
    epochAtStart: 3,
    epochNow: 3,
  }),
  false,
);
assert.equal(
  shouldIgnoreStaleIdentityResult({
    startedUserId: guestIdentityId(3),
    currentUserId: guestIdentityId(4),
    epochAtStart: 3,
    epochNow: 4,
  }),
  true,
);
assert.equal(
  shouldIgnoreStaleIdentityResult({
    startedUserId: null,
    currentUserId: guestIdentityId(1),
    epochAtStart: 1,
    epochNow: 1,
  }),
  true,
);

// --- publicRequest never authorizes and refuses non-public paths ---
{
  let headers;
  const result = await executePublicRequest(
    '/public/feed',
    { headers: { Authorization: 'Bearer stolen' } },
    {
      apiBaseUrl: 'https://api.test/api/v1',
      fetch: async (_url, init) => {
        headers = init.headers;
        return jsonResponse(200, { items: [] });
      },
    },
  );
  assert.deepEqual(result, { items: [] });
  assert.equal(headers.get('Authorization'), null);
}

await assert.rejects(
  () =>
    executePublicRequest(
      '/users/me',
      {},
      {
        apiBaseUrl: 'https://api.test/api/v1',
        fetch: async () => jsonResponse(200, { leaked: true }),
      },
    ),
  /publicRequest may only call/,
);

const consumed = await consumeResponseBody(jsonResponse(204));
assert.equal(consumed.status, 204);
assert.equal(consumed.json, undefined);

assert.equal(isStaleIdentityError(new StaleIdentityError()), true);

const apiClient = read('src/lib/apiClient.ts');
assert.equal(apiClient.includes('getSession()'), false);
assert.match(apiClient, /publicRequest/);
assert.match(apiClient, /never inspects the session|Never inspects the session/);
assert.doesNotMatch(apiClient, /supabase/);

const fences = read('src/lib/identityFences.ts');
assert.match(fences, /consumeResponseBody/);
const consumeAt = fences.indexOf(
  'const consumed = await consumeResponseBody',
);
const finalFenceAt = fences.indexOf(
  'assertLivePrincipal(deps.principal, deps);',
  consumeAt,
);
assert.ok(consumeAt !== -1 && finalFenceAt > consumeAt);
assert.ok(finalFenceAt < fences.indexOf('deps.onAccountSuspended'));
assert.match(fences, /allowGetRetry/);
assert.match(fences, /retriedGet/);
assert.match(fences, /Never returns/);
assert.match(fences, /session.user.id !== input.principal.userId/);

const auth = read('src/context/AuthContext.tsx');
assert.match(auth, /registerAuthRequestRuntime/);
assert.match(auth, /registerSupabaseAutoRefreshLifecycle/);
assert.match(auth, /startAutoRefresh|registerSupabaseAutoRefreshLifecycle/);
assert.match(auth, /stampPendingSignupFromSession\(data\.session, \{ createIfMissing: true \}\)/);
assert.match(auth, /previousUserId && previousUserId !== active.user.id/);
assert.match(auth, /authEpoch.current \+= 1/);
assert.match(auth, /user.id !== sessionSnap.user.id/);
assert.match(auth, /isMawahibProfileMissingError/);
assert.doesNotMatch(
  auth.slice(
    auth.indexOf('const hydrateBackendUser'),
    auth.indexOf('const refreshMe'),
  ),
  /err.status !== 404/,
);
const hydrate = auth.slice(
  auth.indexOf('const hydrateBackendUser'),
  auth.indexOf('const refreshMe'),
);
assert.ok(
  hydrate.indexOf('isMawahibProfileMissingError') <
    hydrate.indexOf('authApi.bootstrap'),
);
assert.ok(
  hydrate.indexOf('isAccountSuspendedError') <
    hydrate.indexOf('authApi.bootstrap'),
);
assert.match(auth, /if \(sessionChanged\) continue/);
const verifySlice = auth.slice(
  auth.indexOf('const verifySignupOtp'),
  auth.indexOf('const sendPhoneOtp'),
);
assert.ok(
  verifySlice.indexOf('stampPendingSignupFromSession') <
    verifySlice.indexOf('hydrateBackendUser(data.session)'),
);

const autoRefresh = read('src/lib/supabaseAutoRefresh.ts');
assert.match(autoRefresh, /startAutoRefresh\(\)/);
assert.match(autoRefresh, /stopAutoRefresh\(\)/);
assert.match(autoRefresh, /AppState.addEventListener\('change'/);
assert.match(autoRefresh, /listenerCount/);

const upload = read('src/lib/uploadMedia.ts');
assert.match(upload, /captureAuthenticatedPrincipal\(\)/);
assert.ok(
  upload.indexOf('const principal = captureAuthenticatedPrincipal()') <
    upload.indexOf('mediaApi.createUploadSession'),
);
assert.ok(
  upload.indexOf('principalsEqual(principal, captureAuthenticatedPrincipal())') <
    upload.indexOf('mediaApi.completeUpload'),
);
assert.match(upload, /completeUpload\(session.mediaAssetId, \{\s*principal/);

console.log('identity-fence-selftest ok');
