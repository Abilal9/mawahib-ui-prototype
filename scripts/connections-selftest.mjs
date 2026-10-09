import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

const connectionsScreen = read('src/screens/profile/ConnectionsScreen.tsx');
const header = read('src/components/profile/ProfileCollapsingHeader.tsx');
const hero = read('src/components/profile/ProfileHero.tsx');
const context = read('src/context/ConnectionsContext.tsx');
const notifications = read('src/screens/home/NotificationsScreen.tsx');
const profile = read('src/screens/profile/UserProfileScreen.tsx');

assert.equal(connectionsScreen.includes('visitorConnections'), false);
assert.equal(connectionsScreen.includes('[] as User[]'), false);
assert.equal(connectionsScreen.includes('listMutual'), true);
assert.equal(connectionsScreen.includes('Mutual Connections'), true);
assert.equal(connectionsScreen.includes('No mutual connections yet.'), true);
assert.equal(connectionsScreen.includes('Showing only connections you share.'), true);
assert.equal(connectionsScreen.includes('openUserProfile'), true);
assert.equal(connectionsScreen.includes('connectedUsers'), true);

assert.equal(header.includes('user.followers'), false);
assert.equal(hero.includes('user.followers'), false);
assert.equal(profile.includes('connectionsCount'), true);
assert.equal(profile.includes('connectionsLabel="Connections"'), false);

assert.equal(context.includes('connection_accepted'), true);
assert.equal(context.includes('await refresh()'), true);
assert.equal(notifications.includes('await refreshConnections()'), true);

function peerId(edge, viewerId) {
  return edge.userLowId === viewerId ? edge.userHighId : edge.userLowId;
}

const edge = { userLowId: 'a', userHighId: 'b', endedAt: null };
assert.equal(peerId(edge, 'a'), 'b');
assert.equal(peerId(edge, 'b'), 'a');

function count(userId, edges) {
  return edges.filter(
    (row) =>
      row.endedAt == null &&
      (row.userLowId === userId || row.userHighId === userId),
  ).length;
}

assert.equal(count('a', [edge]), 1);
assert.equal(count('b', [edge]), 1);
assert.equal(count('a', [{ ...edge, endedAt: new Date() }]), 0);
assert.equal(count('a', []), 0);

function methodBody(source, needle) {
  const start = source.indexOf(needle);
  assert.ok(start >= 0, `${needle} missing`);
  const end = source.indexOf('\n      },', start);
  assert.ok(end > start, `${needle} end missing`);
  return source.slice(start, end);
}

const mutationMethods = {
  requestConnect: 'requestConnect: async',
  acceptRequest: 'acceptRequest: (userId, requestIdOverride)',
  disconnect: 'disconnect: (userId) => {',
  cancelOutgoing: 'cancelOutgoing: (userId) => {',
  denyRequest: 'denyRequest: (userId) => {',
};

for (const [name, needle] of Object.entries(mutationMethods)) {
  const body = methodBody(context, needle);
  assert.ok(body.includes('epoch.current += 1'), `${name} must bump the refresh epoch`);
}

for (const [name, write] of [
  ['cancelOutgoing', 'setOutgoingIds'],
  ['denyRequest', 'setIncomingUsers'],
]) {
  const body = methodBody(context, mutationMethods[name]);
  const bump = body.indexOf('epoch.current += 1');
  const optimistic = body.indexOf(write, bump);
  assert.ok(
    bump >= 0 && optimistic > bump,
    `${name} must invalidate older refreshes before the optimistic update`,
  );
  assert.equal(body.includes('inflightEpoch.current === mutationEpoch'), true);
  assert.equal(body.includes('await refresh()'), true);
}

function applyRefresh(state, started, serverIds) {
  if (started !== state.epoch) return false;
  state.ids = serverIds.slice();
  state.inflightEpoch = started;
  return true;
}

function beginMutation(state) {
  state.epoch += 1;
  state.ids = [];
  return state.epoch;
}

const cancelRace = { epoch: 0, ids: ['peer'], inflightEpoch: null };
const stale = cancelRace.epoch;
beginMutation(cancelRace);
assert.equal(applyRefresh(cancelRace, stale, ['peer']), false);
assert.deepEqual(cancelRace.ids, []);

const denyRace = { epoch: 4, ids: ['requester'], inflightEpoch: 4 };
const denyStarted = denyRace.epoch;
beginMutation(denyRace);
assert.equal(applyRefresh(denyRace, denyStarted, ['requester']), false);
assert.deepEqual(denyRace.ids, []);

const overlapped = { epoch: 0, ids: ['peer'], inflightEpoch: null };
beginMutation(overlapped);
overlapped.inflightEpoch = overlapped.epoch;
const mutationEpoch = overlapped.epoch;
if (overlapped.inflightEpoch === mutationEpoch) {
  overlapped.epoch += 1;
}
assert.equal(applyRefresh(overlapped, mutationEpoch, ['peer']), false);
assert.equal(applyRefresh(overlapped, overlapped.epoch, []), true);
assert.deepEqual(overlapped.ids, []);

function switchTarget(screen, nextId) {
  if (screen.forId === nextId) return screen;
  return {
    forId: nextId,
    items: [],
    total: null,
    error: null,
    loading: Boolean(nextId),
  };
}

const profileA = {
  forId: 'najd',
  items: [{ id: 'shared' }],
  total: 3,
  error: 'Cannot GET',
  loading: false,
};
const profileB = switchTarget(profileA, 'layla');
assert.deepEqual(profileB.items, []);
assert.equal(profileB.total, null);
assert.equal(profileB.error, null);
assert.equal(profileB.loading, true);
assert.equal(profileB.forId, 'layla');

function applyMutual(screen, requestFor, payload) {
  if (requestFor !== screen.forId) return false;
  screen.items = payload.items;
  screen.total = payload.total;
  screen.loading = false;
  return true;
}

assert.equal(
  applyMutual(profileB, 'najd', { items: [{ id: 'shared' }], total: 3 }),
  false,
);
assert.deepEqual(profileB.items, []);
assert.equal(applyMutual(profileB, 'layla', { items: [], total: 1 }), true);
assert.equal(profileB.total, 1);

assert.equal(connectionsScreen.includes('mutualForId'), true);
assert.equal(connectionsScreen.includes('setMutualItems([])'), true);
assert.equal(connectionsScreen.includes('setMutualTotal(null)'), true);
assert.equal(connectionsScreen.includes('setMutualError(null)'), true);
assert.equal(connectionsScreen.includes('if (cancelled) return'), true);
assert.equal(
  connectionsScreen.includes('visitorUser.user?.id === viewedUserId'),
  true,
);
assert.equal(connectionsScreen.includes('visitorHeaderPending'), true);
assert.equal(connectionsScreen.includes('No mutual connections yet.'), true);

console.log('connections-selftest ok');
