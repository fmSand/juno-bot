import { TASK_STATUS } from "../../../../services/TaskService.js";

/**
 * @desc Fetch session + current task context for task detail views.
 * @param {Object} taskService - TaskService instance
 * @param {Object} sessionService - SessionService instance
 * @param {string} internalUserId - Internal user UUID
 * @returns {Promise<{hasActiveSession: boolean, currentTaskId: number|null}>}
 */
export async function getTaskDetailContext(taskService, sessionService, internalUserId) {
  const activeSession = await sessionService.getOneActive(internalUserId);

  if (!activeSession) {
    return { hasActiveSession: false, currentTaskId: null };
  }

  const currentTask = await taskService.getCurrentTaskForSession(activeSession.id);

  return {
    hasActiveSession: true,
    currentTaskId: currentTask?.id ?? null,
  };
}

/**
 * Fetch tasks based on filter value
 * @param {Object} taskService - TaskService instance
 * @param {string} userId - Internal user UUID
 * @param {string} filter - Filter value (active, todo, in_progress, done, all)
 * @returns {Promise<Array>} Filtered tasks with project info
 */
export async function fetchFilteredTasks(taskService, userId, filter) {
  const filterMap = {
    active: [TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS],
    [TASK_STATUS.TODO]: TASK_STATUS.TODO,
    [TASK_STATUS.IN_PROGRESS]: TASK_STATUS.IN_PROGRESS,
    [TASK_STATUS.DONE]: TASK_STATUS.DONE,
    all: null,
  };

  const status =
    filter in filterMap ? filterMap[filter] : [TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS];

  return taskService.getByUser(userId, {
    status,
    includeProject: true,
  });
}
