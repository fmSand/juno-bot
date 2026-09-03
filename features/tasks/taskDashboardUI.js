import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ContainerBuilder,
  SeparatorSpacingSize,
  TimestampStyles,
  time,
} from "discord.js";
import { TASK_STATUS } from "../../services/TaskService.js";

// ------ CONFIGURATION ------
export const STATUS_CONFIG = {
  [TASK_STATUS.IN_PROGRESS]: { emoji: "🔵", label: "In Progress", color: 0x3498db },
  [TASK_STATUS.TODO]: { emoji: "🟡", label: "Todo", color: 0xf1c40f },
  [TASK_STATUS.DONE]: { emoji: "✅", label: "Done", color: 0x2ecc71 },
  [TASK_STATUS.ARCHIVED]: { emoji: "📦", label: "Archived", color: 0x95a5a6 },
};

const FILTER_OPTIONS = [
  { label: "Active (Todo + In Progress)", value: "active", emoji: "📋" },
  { label: "Todo only", value: TASK_STATUS.TODO, emoji: "🟡" },
  { label: "In Progress only", value: TASK_STATUS.IN_PROGRESS, emoji: "🔵" },
  { label: "Done", value: TASK_STATUS.DONE, emoji: "✅" },
  { label: "All Tasks", value: "all" },
];

const DISCORD_SELECT_LIMIT = 25;
const TASK_PREVIEW_LIMIT = 20;

// ------ MAIN DASHBOARD BUILDERS ------
/**
 * Build the task dashboard UI (Components v2)
 * @param {Array} tasks - User's tasks
 * @param {Object} options
 * @param {string} options.filter - Current filter value
 * @param {string|null} options.selectedTaskId - Currently selected task
 * @param {string|null} options.notification - Optional notification message to show
 */
export function buildTaskDashboard(
  tasks = [],
  { filter = "active", selectedTaskId = null, notification = null } = {},
) {
  const components = [];

  if (notification) {
    components.unshift(buildNotificationComponent(notification));
  }

  const container = new ContainerBuilder().setAccentColor(0x5865f2);

  container.addSectionComponents((section) =>
    section
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(`## 📋 Your Tasks (${tasks.length})`),
      )
      .setButtonAccessory((button) =>
        button.setCustomId("tasks:new").setLabel("New Task").setStyle(ButtonStyle.Primary),
      ),
  );

  container.addSeparatorComponents((separator) =>
    separator.setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  const grouped = groupTasksByStatus(tasks);

  const statusesToShow =
    filter === "all"
      ? [TASK_STATUS.IN_PROGRESS, TASK_STATUS.TODO, TASK_STATUS.DONE, TASK_STATUS.ARCHIVED]
      : [TASK_STATUS.IN_PROGRESS, TASK_STATUS.TODO, TASK_STATUS.DONE];

  if (tasks.length === 0) {
    container.addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent("_No tasks found for this filter._"),
    );
  } else {
    for (const status of statusesToShow) {
      const statusTasks = grouped[status] || [];
      if (statusTasks.length > 0) {
        const config = STATUS_CONFIG[status] || STATUS_CONFIG[TASK_STATUS.TODO];

        let statusContent = `${config.emoji} **${config.label}** (${statusTasks.length})\n`;

        const preview = statusTasks.slice(0, TASK_PREVIEW_LIMIT);
        for (const task of preview) {
          const projectPrefix = task.project?.name ? `[${task.project.name}] ` : "";
          statusContent += `• ${projectPrefix}${truncate(task.title, 60)}\n`;
        }

        if (statusTasks.length > TASK_PREVIEW_LIMIT) {
          statusContent += `_...and ${statusTasks.length - TASK_PREVIEW_LIMIT} more_`;
        }

        container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(statusContent));
      }
    }
  }

  components.push(container);

  const filterSelect = new StringSelectMenuBuilder()
    .setCustomId("tasks:filter")
    .setPlaceholder("Filter tasks")
    .addOptions(
      FILTER_OPTIONS.map((opt) => {
        const option = new StringSelectMenuOptionBuilder().setLabel(opt.label).setValue(opt.value);

        if (opt.emoji) {
          option.setEmoji(opt.emoji);
        }

        if (opt.value === filter) {
          option.setDefault(true);
        }

        return option;
      }),
    );

  components.push(new ActionRowBuilder().addComponents(filterSelect));

  const selectableTasks = tasks.filter((t) => t.status !== TASK_STATUS.ARCHIVED);

  if (selectableTasks.length > 0) {
    const taskOptions = selectableTasks.slice(0, DISCORD_SELECT_LIMIT).map((task) => {
      const config = STATUS_CONFIG[task.status] || STATUS_CONFIG[TASK_STATUS.TODO];
      const option = new StringSelectMenuOptionBuilder()
        .setLabel(truncate(task.title, 60))
        .setValue(String(task.id))
        .setEmoji(config.emoji);

      if (task.project?.name) {
        option.setDescription(truncate(task.project.name, 60));
      }

      if (selectedTaskId && String(task.id) === String(selectedTaskId)) {
        option.setDefault(true);
      }

      return option;
    });

    const taskSelect = new StringSelectMenuBuilder()
      .setCustomId("tasks:select")
      .setPlaceholder("Select a task to view details")
      .addOptions(taskOptions);

    components.push(new ActionRowBuilder().addComponents(taskSelect));
  }

  return {
    components,
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
  };
}

/**
 * Build task detail view (Components v2)
 * @param {Object} task - The task to display
 * @param {Object} options
 * @param {boolean} options.hasActiveSession - Whether user is clocked in
 * @param {number|null} options.currentTaskId - ID of the task linked to current session
 * @param {string|null} options.notification - Optional notification message
 */
export function buildTaskDetail(
  task,
  { hasActiveSession = false, currentTaskId = null, notification = null } = {},
) {
  const config = STATUS_CONFIG[task.status] || STATUS_CONFIG[TASK_STATUS.TODO];
  const components = [];

  if (notification) {
    components.unshift(buildNotificationComponent(notification, 0x2ecc71));
  }

  const container = new ContainerBuilder().setAccentColor(config.color || 0x5865f2);

  const isActionable = task.status !== TASK_STATUS.DONE && task.status !== TASK_STATUS.ARCHIVED;
  const isCurrentTask = currentTaskId != null && String(currentTaskId) === String(task.id);

  let headerButton = null;

  if (isActionable) {
    if (!hasActiveSession) {
      headerButton = (button) =>
        button
          .setCustomId(`tasks:start_working:${task.id}`)
          .setLabel("Start Working")
          .setStyle(ButtonStyle.Success);
    } else if (!isCurrentTask) {
      headerButton = (button) =>
        button
          .setCustomId(`tasks:switch_to:${task.id}`)
          .setLabel("Work on this")
          .setStyle(ButtonStyle.Primary);
    }
  }

  if (!headerButton) {
    container.addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(`## ${config.emoji} ${task.title}`),
    );
  } else {
    container.addSectionComponents((section) =>
      section
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(`## ${config.emoji} ${task.title}`),
        )
        .setButtonAccessory(headerButton),
    );
  }

  container.addSeparatorComponents((separator) =>
    separator.setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  let details = "";

  if (task.project?.name) {
    details += `**Project:** ${task.project.name}\n`;
  }

  details += `**Status:** ${config.label}\n`;

  if (task.dueAt) {
    const dueDate = new Date(task.dueAt);
    details += `**Due:** <t:${Math.floor(dueDate.getTime() / 1000)}:R>\n`;
  }

  container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(details));

  if (task.description) {
    container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(task.description));
  }

  const statusButtons = [];

  if (task.status !== TASK_STATUS.TODO) {
    statusButtons.push(
      new ButtonBuilder()
        .setCustomId(`tasks:status:${TASK_STATUS.TODO}:${task.id}`)
        .setLabel("Todo")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🟡"),
    );
  }

  if (task.status !== TASK_STATUS.IN_PROGRESS) {
    statusButtons.push(
      new ButtonBuilder()
        .setCustomId(`tasks:status:${TASK_STATUS.IN_PROGRESS}:${task.id}`)
        .setLabel("In Progress")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🔵"),
    );
  }

  if (task.status !== TASK_STATUS.DONE) {
    statusButtons.push(
      new ButtonBuilder()
        .setCustomId(`tasks:status:${TASK_STATUS.DONE}:${task.id}`)
        .setLabel("Done")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("✅"),
    );
  }

  if (statusButtons.length > 0) {
    container.addSeparatorComponents((separator) =>
      separator.setSpacing(SeparatorSpacingSize.Large).setDivider(false),
    );

    container.addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent("**Change status:**"),
    );

    container.addActionRowComponents(new ActionRowBuilder().addComponents(statusButtons));
  }

  container.addSeparatorComponents((separator) =>
    separator.setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  container.addTextDisplayComponents((textDisplay) =>
    textDisplay.setContent(`_Created ${time(task.createdAt, TimestampStyles.RelativeTime)}_`),
  );

  components.push(container);

  const actionButtons = [
    new ButtonBuilder()
      .setCustomId(`tasks:edit:${task.id}`)
      .setLabel("Edit")
      .setStyle(ButtonStyle.Secondary),
  ];

  if (task.status !== TASK_STATUS.ARCHIVED) {
    actionButtons.push(
      new ButtonBuilder()
        .setCustomId(`tasks:archive:${task.id}`)
        .setLabel("Archive")
        .setStyle(ButtonStyle.Secondary),
    );
  }

  actionButtons.push(
    new ButtonBuilder()
      .setCustomId(`tasks:delete:${task.id}`)
      .setLabel("Delete")
      .setStyle(ButtonStyle.Danger),
  );

  components.push(new ActionRowBuilder().addComponents(actionButtons));

  components.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("tasks:back")
        .setLabel("Back to List")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("⬅️"),
    ),
  );

  return {
    components,
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
  };
}

// ------ CONFIRMATION & UTILITY BUILDERS ------
export function buildDeleteConfirmation(task) {
  const components = [];

  const container = new ContainerBuilder().setAccentColor(0xe74c3c);

  container.addTextDisplayComponents((textDisplay) => textDisplay.setContent("## ⚠️ Delete Task?"));

  container.addSeparatorComponents((separator) =>
    separator.setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  container.addTextDisplayComponents((textDisplay) =>
    textDisplay.setContent(
      `Are you sure you want to delete **"${task.title}"**?\n\n_This cannot be undone._`,
    ),
  );

  components.push(container);

  components.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`tasks:delete_confirm:${task.id}`)
        .setLabel("Yes, Delete")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`tasks:back_to_detail:${task.id}`)
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary),
    ),
  );

  return {
    components,
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
  };
}

export function buildArchiveConfirmation(task) {
  const container = new ContainerBuilder().setAccentColor(0xf1c40f);

  container.addTextDisplayComponents((textDisplay) =>
    textDisplay.setContent(
      `Archive **"${task.title}"**?\n\n_You won't be able to restore this task._`,
    ),
  );

  const components = [
    container,
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`tasks:archive_confirm:${task.id}`)
        .setLabel("Archive")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`tasks:back_to_detail:${task.id}`)
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary),
    ),
  ];

  return { components, flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 };
}

export function buildV2Message(message, { type = "error" } = {}) {
  const colors = {
    error: 0xe74c3c,
    warning: 0xf1c40f,
    info: 0x3498db,
  };

  const color = colors[type] || colors.error;

  return {
    components: [buildNotificationComponent(message, color)],
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
  };
}

/**
 * Build project select menu for modals
 * @param {Array<{id: string, name: string}>} projects - User's active projects
 * @param {string|null} currentProjectId - Currently selected project UUID
 * @param {Object} options
 * @param {boolean} options.required - Whether selection is required (default: false)
 * @returns {StringSelectMenuBuilder} Configured select menu
 */
export function buildProjectSelectForModal(
  projects,
  currentProjectId = null,
  { required = false } = {},
) {
  const options = [];

  options.push(
    new StringSelectMenuOptionBuilder()
      .setLabel("No project")
      .setValue("no_project")
      .setDefault(currentProjectId == null),
  );

  for (const project of projects.slice(0, 24)) {
    const isSelected = currentProjectId != null && String(project.id) === String(currentProjectId);

    options.push(
      new StringSelectMenuOptionBuilder()
        .setLabel(truncate(project.name, 100) || "Unnamed Project")
        .setValue(String(project.id))
        .setDefault(isSelected),
    );
  }

  return new StringSelectMenuBuilder()
    .setCustomId("project_select")
    .setPlaceholder("Select a project...")
    .setRequired(required)
    .addOptions(options);
}

//------ HELPERS ------
function groupTasksByStatus(tasks) {
  return tasks.reduce((acc, task) => {
    const status = task.status || TASK_STATUS.TODO;
    if (!acc[status]) acc[status] = [];
    acc[status].push(task);
    return acc;
  }, {});
}

function truncate(str, max) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

function buildNotificationComponent(message, color = 0x3498db) {
  const container = new ContainerBuilder().setAccentColor(color);
  container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(message));
  return container;
}
