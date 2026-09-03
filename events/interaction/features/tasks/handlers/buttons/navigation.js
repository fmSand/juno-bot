import { setState, refreshDashboard } from "../../task-dashboard-state.js";
import {
  buildTaskDashboard,
  buildTaskDetail,
  buildV2Message,
} from "../../../../../../features/tasks/taskDashboardUI.js";
import { getTaskDetailContext } from "../../task-dashboard-helpers.js";

async function handleBackButton(interaction) {
  setState(interaction.user.id, { selectedTaskId: null });

  await interaction.deferUpdate();

  try {
    const { filter, tasks } = await refreshDashboard(interaction);
    const payload = buildTaskDashboard(tasks, { filter });
    await interaction.editReply(payload);
  } catch (err) {
    console.error("[Task Dashboard] Back error:", err);
    await interaction.editReply(buildV2Message("Something went wrong returning to task list."));
  }
}

async function handleBackToDetail(interaction) {
  const { user } = interaction.botContext;
  const { taskService, sessionService } = interaction.services;

  const taskId = parseInt(interaction.customId.split(":")[2], 10);

  await interaction.deferUpdate();

  try {
    const task = await taskService.getById(taskId, user.id, { includeProject: true });

    if (!task) {
      return interaction.editReply(buildV2Message("⚠️ Task not found.", { type: "warning" }));
    }

    const context = await getTaskDetailContext(taskService, sessionService, user.id);
    const payload = buildTaskDetail(task, context);

    await interaction.editReply(payload);
  } catch (err) {
    console.error("[Task Dashboard] Back to detail error:", err);
    await interaction.editReply(buildV2Message("Failed to load task details."));
  }
}

export const buttonHandlers = {
  back: handleBackButton,
  back_to_detail: handleBackToDetail,
};
