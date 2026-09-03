import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";
import { TASK_STATUS } from "../../services/TaskService.js";

/**
 * Build the clock-in task selection UI
 * @param {Array} tasks - User's active tasks (todo + in_progress)
 * @param {Object} options
 * @param {string|null} options.selectedTaskId - Pre-selected task ID
 * @returns {Object} Message payload with components
 */
export function buildClockInUI(tasks = [], { selectedTaskId = null } = {}) {
  const components = [];

  if (tasks.length > 0) {
    const taskOptions = tasks.slice(0, 25).map((task) => {
      const option = new StringSelectMenuOptionBuilder()
        .setLabel(truncate(task.title, 100))
        .setValue(String(task.id));
      if (task.project?.name) {
        option.setDescription(truncate(task.project.name, 100));
      }
      const emoji = task.status === TASK_STATUS.IN_PROGRESS ? "🔵" : "🟡";
      option.setEmoji(emoji);
      if (selectedTaskId && String(task.id) === String(selectedTaskId)) {
        option.setDefault(true);
      }
      return option;
    });

    const taskSelect = new StringSelectMenuBuilder()
      .setCustomId("clock_in:task_select")
      .setPlaceholder("Select a task to work on")
      .setMinValues(0)
      .setMaxValues(1)
      .addOptions(taskOptions);
    components.push(new ActionRowBuilder().addComponents(taskSelect));
  }

  const buttons = [];
  if (tasks.length > 0) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId("clock_in:continue")
        .setLabel("Continue")
        .setStyle(ButtonStyle.Success)
        .setEmoji("▶️"),
    );
  }

  buttons.push(
    new ButtonBuilder()
      .setCustomId("clock_in:skip")
      .setLabel(tasks.length > 0 ? "Skip (No Task)" : "Continue")
      .setStyle(tasks.length > 0 ? ButtonStyle.Secondary : ButtonStyle.Success)
      .setEmoji(tasks.length > 0 ? "⏭️" : "▶️"),
  );

  buttons.push(
    new ButtonBuilder()
      .setCustomId("clock_in:new_task")
      .setLabel("New Task")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("➕"),
  );

  buttons.push(
    new ButtonBuilder()
      .setCustomId("clock_in:cancel")
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Secondary),
  );
  components.push(new ActionRowBuilder().addComponents(buttons));

  const taskCount = tasks.length;
  let content = "## Clock In\n\n";

  if (taskCount > 0) {
    content += `You have **${taskCount}** active task${taskCount === 1 ? "" : "s"}.\n`;
    content += "Select a task or skip to clock in without one.";
  } else {
    content += "You have no active tasks.\n";
    content += "Create one or continue without a task.";
  }
  return {
    content,
    components,
    flags: MessageFlags.Ephemeral,
  };
}

function truncate(str, max) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}
