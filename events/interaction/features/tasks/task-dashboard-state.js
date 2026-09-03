import { fetchFilteredTasks } from "./task-dashboard-helpers.js";

const dashboardState = new Map();
const dashboardStateTimeouts = new Map();

const STATE_TTL_MS = 10 * 60 * 1000;

export function getState(userId) {
  return dashboardState.get(userId) ?? { filter: "active", selectedTaskId: null };
}

/**
 * Update user's dashboard state
 * Merges updates with existing state and resets TTL
 * @param {string} userId - Discord user ID
 * @param {Object} updates - State updates to merge
 */
export function setState(userId, updates) {
  const current = getState(userId);
  dashboardState.set(userId, { ...current, ...updates });

  const existingTimeout = dashboardStateTimeouts.get(userId);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  const timeout = setTimeout(() => {
    dashboardState.delete(userId);
    dashboardStateTimeouts.delete(userId);
  }, STATE_TTL_MS);

  dashboardStateTimeouts.set(userId, timeout);
}

export function clearState(userId) {
  dashboardState.delete(userId);
  const existingTimeout = dashboardStateTimeouts.get(userId);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
    dashboardStateTimeouts.delete(userId);
  }
}

export async function refreshDashboard(interaction) {
  const { user } = interaction.botContext;
  const { taskService } = interaction.services;

  const state = getState(interaction.user.id);
  const tasks = await fetchFilteredTasks(taskService, user.id, state.filter);

  return {
    filter: state.filter,
    tasks,
  };
}
