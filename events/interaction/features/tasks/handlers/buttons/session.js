import { ModalBuilder, TextInputBuilder, TextInputStyle, LabelBuilder } from "discord.js";
import {
  buildTaskDetail,
  buildV2Message,
  STATUS_CONFIG,
} from "../../../../../../features/tasks/taskDashboardUI.js";
import { requestDashboardUpdate } from "../../../../../../features/liveDashboard/dashboardUpdater.js";
import {
  DEFAULT_SESSION_MINUTES,
  MIN_SESSION_MINUTES,
  MAX_SESSION_MINUTES,
} from "../../../../../../features/session/constants.js";
import { TASK_STATUS } from "../../../../../../services/TaskService.js";

async function handleStatusChange(interaction) {
  const { user } = interaction.botContext;
  const { taskService, sessionService } = interaction.services;

  const parts = interaction.customId.split(":");
  const newStatus = parts[2];
  const taskId = parseInt(parts[3], 10);

  await interaction.deferUpdate();

  try {
    const updatedTask = await taskService.updateStatus(taskId, user.id, newStatus);

    if (!updatedTask) {
      return interaction.editReply(
        buildV2Message("⚠️ Task not found or could not be updated.", { type: "warning" }),
      );
    }

    const task = await taskService.getById(taskId, user.id, { includeProject: true });
    const session = await sessionService.getOneActive(user.id);

    const statusLabel = STATUS_CONFIG[newStatus]?.label || newStatus.replace("_", " ");

    const payload = buildTaskDetail(task, {
      hasActiveSession: !!session,
      notification: `✅ Status updated to **${statusLabel}**`,
    });

    await interaction.editReply(payload);
  } catch (err) {
    console.error("[Task Dashboard] Status change error:", err);

    if (err.code === "INVALID_STATUS") {
      return interaction.editReply(buildV2Message("⚠️ Invalid status.", { type: "warning" }));
    }
    await interaction.editReply(buildV2Message("Something went wrong updating status."));
  }
}

async function handleStartWorking(interaction) {
  const taskId = parseInt(interaction.customId.split(":")[2], 10);

  const modal = new ModalBuilder()
    .setCustomId(`tasks:start_working_modal:${taskId}`)
    .setTitle("Start Working");

  const durationInput = new TextInputBuilder()
    .setCustomId("duration")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder(`defaults to ${DEFAULT_SESSION_MINUTES} minutes`);

  const durationLabel = new LabelBuilder()
    .setLabel(`Session duration (${MIN_SESSION_MINUTES}-${MAX_SESSION_MINUTES} min)`)
    .setTextInputComponent(durationInput);

  modal.addLabelComponents(durationLabel);

  await interaction.showModal(modal);
}

async function handleSwitchToTask(interaction) {
  const { user } = interaction.botContext;
  const { taskService, sessionService } = interaction.services;

  const taskId = parseInt(interaction.customId.split(":")[2], 10);

  await interaction.deferUpdate();

  try {
    const task = await taskService.getById(taskId, user.id, { includeProject: true });
    if (!task) {
      return interaction.editReply(buildV2Message("Task not found.", { type: "warning" }));
    }

    const activeSession = await sessionService.getOneActive(user.id);
    if (!activeSession) {
      const payload = buildTaskDetail(task, {
        hasActiveSession: false,
        currentTaskId: null,
        notification: "You're not clocked in.",
      });
      return interaction.editReply(payload);
    }

    const currentSessionTask = await taskService.getCurrentTaskForSession(activeSession.id);
    const currentTaskId = currentSessionTask?.id ?? null;

    if (currentTaskId != null && String(currentTaskId) === String(task.id)) {
      const payload = buildTaskDetail(task, {
        hasActiveSession: true,
        currentTaskId,
        notification: "You're already working on this task.",
      });
      return interaction.editReply(payload);
    }

    const sessionTask = await taskService.linkToActiveSession(user.id, task.id);
    if (!sessionTask) {
      const payload = buildTaskDetail(task, {
        hasActiveSession: true,
        currentTaskId,
        notification: "Couldn't switch to that task.",
      });
      return interaction.editReply(payload);
    }

    const activity = task.project?.name ? `[${task.project.name}] ${task.title}` : task.title;
    await sessionService.updateActivity(user.id, activity);

    if (task.status === TASK_STATUS.TODO) {
      await taskService.updateStatus(task.id, user.id, TASK_STATUS.IN_PROGRESS);
      task.status = TASK_STATUS.IN_PROGRESS;
    }

    const payload = buildTaskDetail(task, {
      hasActiveSession: true,
      currentTaskId: task.id,
      notification: "✅ Now working on this task!",
    });

    await interaction.editReply(payload);

    requestDashboardUpdate(interaction.client);
  } catch (err) {
    console.error("[Task Dashboard] Switch task error:", err);
    await interaction.editReply(buildV2Message("Something went wrong switching tasks."));
  }
}

export const buttonHandlers = {
  status: handleStatusChange,
  start_working: handleStartWorking,
  switch_to: handleSwitchToTask,
};
