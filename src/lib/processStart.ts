/**
 * Process-memory latch: Splash1/Splash2 run once per JS runtime.
 * Resets when the process restarts. Must not live in a component.
 */

let processStartConsumed = false;

export function hasConsumedProcessStart(): boolean {
  return processStartConsumed;
}

export function consumeProcessStart(): void {
  processStartConsumed = true;
}
