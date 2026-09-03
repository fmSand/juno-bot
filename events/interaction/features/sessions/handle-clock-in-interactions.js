import { ModalBuilder, TextInputBuilder, TextInputStyle, LabelBuilder } from "discord.js";
import { buildClockInMessagePayload } from "../../../../features/session/messageBuilder.js";
import { startTimer } from "../../../../features/session/timerManager.js";
import { requestDashboardUpdate } from "../../../../features/liveDashboard/dashboardUpdater.js";
import { getClockInState, setClockInState, clearClockInState } from "./clock-in-state.js";
import {
  DEFAULT_SESSION_MINUTES,
  MAX_SESSION_MINUTES,
  MIN_SESSION_MINUTES,
} from "../../../../features/session/constants.js";
import { TASK_STATUS } from "../../../../services/TaskService.js";

function showDurationModal(interaction) {
  const modal = new ModalBuilder().setCustomId("clock_in:duration_modal").setTitle("Clock In");

  const durationInput = new TextInputBuilder()
    .setCustomId("duration")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder(`defaults to ${DEFAULT_SESSION_MINUTES} minutes`);

  const durationLabel = new LabelBuilder()
    .setLabel(`How long will you work? (${MIN_SESSION_MINUTES}-${MAX_SESSION_MINUTES} min)`)
    .setTextInputComponent(durationInput);

  modal.addLabelComponents(durationLabel);

  return interaction.showModal(modal);
}

export async function handleTaskSelect(interaction) {
  const selectedTaskId = interaction.values[0] ?? null;
  setClockInState(interaction.user.id, { taskId: selectedTaskId });
  await interaction.deferUpdate();
}

export async function handleContinueButton(interaction) {
  await showDurationModal(interaction);
}

export async function handleSkipButton(interaction) {
  setClockInState(interaction.user.id, { taskId: null });
  await showDurationModal(interaction);
}

export async function handleNewTaskButton(interaction) {
  const modal = new ModalBuilder()
    .setCustomId("clock_in:new_task_modal")
    .setTitle("Create New Task");

  const titleInput = new TextInputBuilder()
    .setCustomId("title")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(200)
    .setPlaceholder("e.g., Implement user authentication");

  const descriptionInput = new TextInputBuilder()
    .setCustomId("description")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setMaxLength(1000)
    .setPlaceholder("Add any notes or details...");

  const durationInput = new TextInputBuilder()
    .setCustomId("duration")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder(`defaults to ${DEFAULT_SESSION_MINUTES} minutes`);

  modal.addLabelComponents(
    new LabelBuilder().setLabel("Task title").setTextInputComponent(titleInput),
    new LabelBuilder().setLabel("Description (optional)").setTextInputComponent(descriptionInput),
    new LabelBuilder()
      .setLabel(`Session duration (${MIN_SESSION_MINUTES}-${MAX_SESSION_MINUTES} min)`)
      .setTextInputComponent(durationInput),
  );

  await interaction.showModal(modal);
}

export async function handleCancelButton(interaction) {
  clearClockInState(interaction.user.id);

  await interaction.update({
    content: "Clock-in cancelled.",
    components: [],
  });
}

export async function handleNewTaskModal(interaction) {
  const { user } = interaction.botContext;
  const { taskService, sessionService } = interaction.services;

  await interaction.deferUpdate();

  try {
    const title = interaction.fields.getTextInputValue("title");
    const description = interaction.fields.getTextInputValue("description") || null;
    const durationInput = interaction.fields.getTextInputValue("duration")?.trim();

    let duration = DEFAULT_SESSION_MINUTES;
    if (durationInput) {
      const parsed = parseInt(durationInput, 10);
      if (!isNaN(parsed)) {
        duration = Math.max(MIN_SESSION_MINUTES, Math.min(parsed, MAX_SESSION_MINUTES));
      }
    }

    const task = await taskService.create(user.id, {
      title,
      description,
      status: TASK_STATUS.IN_PROGRESS,
    });

    const activity = task.title;

    const session = await sessionService.start(user.id, {
      activity,
      targetDurationMinutes: duration,
    });

    await taskService.linkToActiveSession(user.id, task.id);

    startTimer(interaction.client, session, duration);
    clearClockInState(interaction.user.id);

    const payload = buildClockInMessagePayload({
      session,
      targetDurationMinutes: duration,
      activity,
    });

    await interaction.editReply(payload);

    requestDashboardUpdate(interaction.client);
  } catch (err) {
    console.error("[Clock-in New Task] Error:", err);
    return interaction.editReply({
      content: "Something went wrong creating your task.",
      components: [],
    });
  }
}

export async function handleDurationModal(interaction) {
  const { user } = interaction.botContext;
  const { sessionService, taskService } = interaction.services;

  await interaction.deferUpdate();

  try {
    const durationInput = interaction.fields.getTextInputValue("duration")?.trim();
    const state = getClockInState(interaction.user.id);
    const taskId = state.taskId;

    let duration = DEFAULT_SESSION_MINUTES;
    if (durationInput) {
      const parsed = parseInt(durationInput, 10);
      if (!isNaN(parsed)) {
        duration = Math.max(MIN_SESSION_MINUTES, Math.min(parsed, MAX_SESSION_MINUTES));
      }
    }

    let activity = null;
    let task = null;
    if (taskId) {
      task = await taskService.getById(taskId, user.id, { includeProject: true });
      if (task) {
        activity = task.project?.name ? `[${task.project.name}] ${task.title}` : task.title;
      }
    }

    const session = await sessionService.start(user.id, {
      activity,
      targetDurationMinutes: duration,
    });

    if (!session) {
      clearClockInState(interaction.user.id);

      return interaction.editReply({
        content: "You're already clocked in.",
        components: [],
      });
    }

    if (task) {
      await taskService.linkToActiveSession(user.id, task.id);

      if (task.status === TASK_STATUS.TODO) {
        await taskService.updateStatus(task.id, user.id, TASK_STATUS.IN_PROGRESS);
      }
    }

    startTimer(interaction.client, session, duration);
    clearClockInState(interaction.user.id);

    const payload = buildClockInMessagePayload({
      session,
      targetDurationMinutes: duration,
      activity,
    });

    await interaction.editReply(payload);

    requestDashboardUpdate(interaction.client);
  } catch (err) {
    console.error("[Clock-in Duration Modal] Error:", err);
    return interaction.editReply({
      content: "Something went wrong starting your session.",
      components: [],
    });
  }
}

export async function handleClockingInButtons(interaction) {
  const [, action] = interaction.customId.split(":");

  switch (action) {
    case "continue":
      return handleContinueButton(interaction);
    case "skip":
      return handleSkipButton(interaction);
    case "new_task":
      return handleNewTaskButton(interaction);
    case "cancel":
      return handleCancelButton(interaction);
    default:
      console.warn(`[Clock-in] Unknown button action: ${action}`);
  }
}

export async function handleClockInSelects(interaction) {
  const [, action] = interaction.customId.split(":");

  switch (action) {
    case "task_select":
      return handleTaskSelect(interaction);
    default:
      console.warn(`[Clock-in] Unknown select action: ${action}`);
  }
}

export async function handleClockInModals(interaction) {
  const [, action] = interaction.customId.split(":");

  switch (action) {
    case "new_task_modal":
      return handleNewTaskModal(interaction);
    case "duration_modal":
      return handleDurationModal(interaction);
    default:
      console.warn(`[Clock-in] Unknown modal action: ${action}`);
  }
}
