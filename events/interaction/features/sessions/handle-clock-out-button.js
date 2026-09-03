import { MessageFlags } from "discord.js";
import { buildClockOutMessagePayload } from "../../../../features/session/messageBuilder.js";
import { cancelTimer } from "../../../../features/session/timerManager.js";
import { requestDashboardUpdate } from "../../../../features/liveDashboard/dashboardUpdater.js";

export async function handleClockOutButton(interaction) {
  const { user, session } = interaction.botContext;
  const { sessionService, taskService } = interaction.services;

  await interaction.deferUpdate();

  try {
    if (session) {
      cancelTimer(session.id);
    }

    const result = await sessionService.end(user.id);

    if (!result) {
      return interaction.editReply({
        content: "Already clocked out ✓",
        components: [],
      });
    }

    const tasksWorkedOn = await taskService.getTasksForSession(result.session.id);
    const payload = buildClockOutMessagePayload(result, { tasksWorkedOn });

    await interaction.editReply(payload);

    requestDashboardUpdate(interaction.client);
  } catch (err) {
    console.error("[Session Guard] Clock-out button error:", err);
    return interaction.followUp({
      content: "Errmmm you broke something wasn't me! 👀",
      flags: MessageFlags.Ephemeral,
    });
  }
}
