import { MessageFlags } from "discord.js";
import { buildClockInUI } from "../../../../features/session/clockInUI.js";
import { buildClockOutMessagePayload } from "../../../../features/session/messageBuilder.js";
import { cancelTimer } from "../../../../features/session/timerManager.js";
import { requestDashboardUpdate } from "../../../../features/liveDashboard/dashboardUpdater.js";

export async function handleDashboardButtons(interaction) {
  const { session, user } = interaction.botContext;
  if (session) {
    return clockOutFromDashboard(interaction, user, session);
  }
  return clockInFromDashboard(interaction, user);
}

async function clockInFromDashboard(interaction, user) {
  const { taskService } = interaction.services;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    const tasks = await taskService.getActiveByUser(user.id, { includeProject: true });
    const payload = buildClockInUI(tasks);
    await interaction.editReply(payload);
  } catch (err) {
    console.error("[Dashboard] Clock-in error:", err);
    await interaction.editReply({ content: "Something went wrong starting clock-in." });
  }
}

async function clockOutFromDashboard(interaction, user, session) {
  const { sessionService, taskService } = interaction.services;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    cancelTimer(session.id);
    const result = await sessionService.end(user.id);
    if (!result) {
      return interaction.editReply({ content: "Already clocked out ✓" });
    }
    const tasksWorkedOn = await taskService.getTasksForSession(result.session.id);
    const payload = buildClockOutMessagePayload(result, { tasksWorkedOn });
    await interaction.editReply(payload);
    requestDashboardUpdate(interaction.client);
  } catch (err) {
    console.error("[Dashboard] Clock-out error:", err);
    await interaction.editReply({ content: "Something went wrong clocking out." });
  }
}
