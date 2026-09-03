import { refreshDashboard } from "../../task-dashboard-state.js";
import {
  buildTaskDashboard,
  buildTaskDetail,
  buildV2Message,
} from "../../../../../../features/tasks/taskDashboardUI.js";
import { getTaskDetailContext } from "../../task-dashboard-helpers.js";
import { TASK_STATUS } from "../../../../../../services/TaskService.js";

/**
 * Extract project ID from modal select menu
 * @param {ModalSubmitInteraction} interaction
 * @returns {string|null} Project UUID or null
 */
function getProjectIdFromModal(interaction) {
  try {
    const values = interaction.fields.getStringSelectValues("project_select");

    if (!values || values.length === 0) {
      return null;
    }

    const value = values[0];
    return value === "no_project" ? null : value;
  } catch (err) {
    return null;
  }
}

async function handleNewTask(interaction) {
  const { user } = interaction.botContext;
  const { taskService } = interaction.services;

  await interaction.deferUpdate();

  try {
    const title = interaction.fields.getTextInputValue("title");
    const description = interaction.fields.getTextInputValue("description") || null;
    const projectId = getProjectIdFromModal(interaction);

    await taskService.create(user.id, {
      title,
      description,
      status: TASK_STATUS.TODO,
      projectId,
    });

    const { filter, tasks } = await refreshDashboard(interaction);

    const payload = buildTaskDashboard(tasks, {
      filter,
      notification: `✅ Task created: **${title}**`,
    });

    await interaction.editReply(payload);
  } catch (err) {
    console.error("[Task Dashboard] New task error:", err);
    await interaction.editReply(buildV2Message("Something went wrong creating your task."));
  }
}

async function handleEdit(interaction) {
  const { user } = interaction.botContext;
  const { taskService, sessionService } = interaction.services;

  const taskId = parseInt(interaction.customId.split(":")[2], 10);

  await interaction.deferUpdate();

  try {
    const title = interaction.fields.getTextInputValue("title");
    const description = interaction.fields.getTextInputValue("description") || null;
    const projectId = getProjectIdFromModal(interaction);

    const updatedTask = await taskService.update(taskId, user.id, {
      title,
      description,
      projectId,
    });

    if (!updatedTask) {
      return interaction.editReply(
        buildV2Message("⚠️ Task not found or could not be updated.", { type: "warning" }),
      );
    }

    const task = await taskService.getById(taskId, user.id, { includeProject: true });
    const context = await getTaskDetailContext(taskService, sessionService, user.id);

    const payload = buildTaskDetail(task, {
      ...context,
      notification: "✅ Task updated!",
    });

    await interaction.editReply(payload);
  } catch (err) {
    console.error("[Task Dashboard] Edit modal error:", err);
    await interaction.editReply(buildV2Message("Something went wrong updating your task."));
  }
}

export const modalHandlers = {
  new_modal: handleNewTask,
  edit_modal: handleEdit,
};
