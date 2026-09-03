import { time, TimestampStyles } from "discord.js";
import { formatDurationMs, formatMinutesHm } from "../../utils/formatTime.js";

/**
 * @param {Object} result - Session end result
 * @param {Object} result.session - Ended session
 * @param {number} result.durationMs - Session duration in milliseconds
 * @param {Object} options
 * @param {Array} options.tasksWorkedOn - Array from getTasksForSession()
 * @returns {Object} Message payload
 */
export function buildClockOutMessagePayload({ session, durationMs }, { tasksWorkedOn = [] } = {}) {
  const started = time(session.startedAt, TimestampStyles.ShortTime);
  const ended = time(session.endedAt, TimestampStyles.ShortTime);
  const duration = formatDurationMs(durationMs, { mode: "round" });

  let workContent = "";

  const tasks = tasksWorkedOn.map((st) => st.task).filter(Boolean);

  if (tasks.length === 1) {
    workContent = `\nWorked on: ${formatTask(tasks[0])}`;
  } else if (tasks.length > 1) {
    workContent = `\n\n**Worked on (${tasks.length} tasks):**\n`;
    workContent += tasks.map((t) => `• ${formatTask(t)}`).join("\n");
  } else if (session.activity) {
    workContent = `\nWorked on: ${session.activity}`;
  }

  return {
    content:
      `✅ **Clocked out**\n\n` +
      `Started: ${started}\n` +
      `Ended: ${ended}\n` +
      `You worked for ${duration}${workContent}`,
    components: [],
  };
}

export function buildClockInMessagePayload({ session, targetDurationMinutes, activity }) {
  const started = time(session.startedAt, TimestampStyles.ShortTime);
  const plannedEndDate = new Date(session.startedAt.getTime() + targetDurationMinutes * 60000);
  const endsAt = time(plannedEndDate, TimestampStyles.ShortTime);
  const duration = formatMinutesHm(targetDurationMinutes);
  const activityText = activity ? `\nWorking on: ${activity}` : "";

  return {
    content:
      `✅ **Clocked in!**\n\n` +
      `Started: ${started}\n` +
      `Planned duration: ${duration}\n` +
      `Session ends: ${endsAt}${activityText}`,
    components: [],
  };
}

/**
 * Format a task with optional project prefix
 * @param {Object} task - Task object with optional project
 * @returns {string} Formatted task string
 */
function formatTask(task) {
  return task.project?.name ? `[${task.project.name}] ${task.title}` : task.title;
}
