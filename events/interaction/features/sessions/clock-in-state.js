/**
 * Temporary state for the clock-in interaction flow.
 * Handles user-specific selected task with automatic cleanup
 */
const clockInState = new Map();
const clockInStateTimeouts = new Map();

const STATE_TTL_MS = 5 * 60 * 1000;

export function getClockInState(userId) {
  return clockInState.get(userId) ?? { taskId: null };
}

export function setClockInState(userId, updates) {
  const current = getClockInState(userId);
  const next = { ...current, ...updates };

  clockInState.set(userId, next);

  const existingTimeout = clockInStateTimeouts.get(userId);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  const timeout = setTimeout(() => {
    clockInState.delete(userId);
    clockInStateTimeouts.delete(userId);
  }, STATE_TTL_MS);

  clockInStateTimeouts.set(userId, timeout);
}

export function clearClockInState(userId) {
  clockInState.delete(userId);
  const existingTimeout = clockInStateTimeouts.get(userId);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
    clockInStateTimeouts.delete(userId);
  }
}
