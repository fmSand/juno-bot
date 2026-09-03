import { MessageFlags } from "discord.js";
import { clearState } from "../../task-dashboard-state.js";
import { buildV2Message } from "../../../../../../features/tasks/taskDashboardUI.js";
import { buildClockInMessagePayload } from "../../../../../../features/session/messageBuilder.js";
import { startTimer } from "../../../../../../features/session/timerManager.js";
import { requestDashboardUpdate } from "../../../../../../features/liveDashboard/dashboardUpdater.js";
import { TASK_STATUS } from "../../../../../../services/TaskService.js";
import {
  DEFAULT_SESSION_MINUTES,
  MIN_SESSION_MINUTES,
  MAX_SESSION_MINUTES,
} from "../../../../../../features/session/constants.js";

async function handleStartWorking(interaction) {
  const { user } = interaction.botContext;
  const { taskService, sessionService } = interaction.services;

  const taskId = parseInt(interaction.customId.split(":")[2], 10);
  const durationInput = interaction.fields.getTextInputValue("duration")?.trim();

  let duration = DEFAULT_SESSION_MINUTES;
  if (durationInput) {
    const parsed = parseInt(durationInput, 10);
    if (!isNaN(parsed)) {
      duration = Math.max(MIN_SESSION_MINUTES, Math.min(parsed, MAX_SESSION_MINUTES));
    }
  }

  await interaction.deferUpdate();

  try {
    const task = await taskService.getById(taskId, user.id, { includeProject: true });

    if (!task) {
      return interaction.editReply(buildV2Message("Task not found.", { type: "warning" }));
    }

    const activity = task.project?.name ? `[${task.project.name}] ${task.title}` : task.title;

    const session = await sessionService.start(user.id, {
      activity,
      targetDurationMinutes: duration,
    });

    if (!session) {
      return interaction.editReply(
        buildV2Message("You're already clocked in.", { type: "warning" }),
      );
    }

    await taskService.linkToActiveSession(user.id, task.id);

    if (task.status === TASK_STATUS.TODO) {
      await taskService.updateStatus(task.id, user.id, TASK_STATUS.IN_PROGRESS);
    }

    startTimer(interaction.client, session, duration);
    clearState(interaction.user.id);

    await interaction.editReply(
      buildV2Message("✅ Session started from this task. You'll get a warning DM before it ends.", {
        type: "info",
      }),
    );

    const clockInPayload = buildClockInMessagePayload({
      session,
      targetDurationMinutes: duration,
      activity,
    });

    await interaction.followUp({ ...clockInPayload, flags: MessageFlags.Ephemeral });

    requestDashboardUpdate(interaction.client);
  } catch (err) {
    console.error("[Task Dashboard] Start working modal error:", err);
    await interaction.editReply(buildV2Message("Something went wrong starting your session."));
  }
}

export const modalHandlers = {
  start_working_modal: handleStartWorking,
};
