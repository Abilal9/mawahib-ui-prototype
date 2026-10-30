/**
 * Serializes session-establishing work with identity-mismatch cleanup.
 * Password sign-in, callback setSession/exchange, and identityMismatch
 * sign-out must not interleave.
 *
 * No local imports so Node selftests can execute this module.
 */

let tail: Promise<unknown> = Promise.resolve();

export function enqueueAuthMutation<T>(fn: () => Promise<T>): Promise<T> {
  const run = tail.then(fn, fn);
  tail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function resetAuthMutationQueueForTests(): void {
  tail = Promise.resolve();
}
