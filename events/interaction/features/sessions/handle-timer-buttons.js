import { time, TimestampStyles, MessageFlags } from "discord.js";
import { formatMinutesHm } from "../../../../utils/formatTime.js";
import { extendTimer, cancelTimer } from "../../../../features/session/timerManager.js";
import { buildClockOutMessagePayload } from "../../../../features/session/messageBuilder.js";
import { requestDashboardUpdate } from "../../../../features/liveDashboard/dashboardUpdater.js";

export async function handleTimerButtons(interaction) {
  await interaction.deferUpdate();

  try {
    const { user } = interaction.botContext;
    const { sessionService, taskService } = interaction.services;
    const parts = interaction.customId.split(":");
    const action = parts[1];
    const sessionId = parts[parts.length - 1];

    const session = await sessionService.getById(sessionId);
    if (!session || session.endedAt || session.userId !== user.id) {
      return interaction.editReply({
        content: "⚠️ This session is no longer active.",
        components: [],
      });
    }

    if (action === "extend") {
      const minutes = parseInt(parts[2], 10);

      const result = await extendTimer(interaction.client, sessionId, minutes);
      if (!result) {
        return interaction.editReply({
          content: "❌ Failed to extend session.",
          components: [],
        });
      }

      const startMs = new Date(session.startedAt).getTime();
      const newDuration = result.session.targetDurationMinutes;
      const newEndTime = new Date(startMs + newDuration * 60000);
      const targetTime = time(newEndTime, TimestampStyles.ShortTime);

      await interaction.editReply({
        content:
          `✅ **Session extended by ${minutes} minutes!**\n\n` +
          `New duration: ${formatMinutesHm(newDuration)}\n` +
          `Your session will now end at: ${targetTime}\n\n` +
          `_You'll receive another warning before it ends._`,
        components: [],
      });

      requestDashboardUpdate(interaction.client);
    } else if (action === "clockout") {
      cancelTimer(sessionId);

      const result = await sessionService.end(user.id);

      if (!result) {
        return interaction.editReply({
          content: "⚠️ Session already ended.",
          components: [],
        });
      }

      const tasksWorkedOn = await taskService.getTasksForSession(result.session.id);
      const payload = buildClockOutMessagePayload(result, { tasksWorkedOn });

      await interaction.editReply(payload);

      requestDashboardUpdate(interaction.client);
    }
  } catch (err) {
    console.error("[Timer Button] Error:", err);
    return interaction.followUp({
      content: "Errmmm you broke something wasn't me! 👀",
      flags: MessageFlags.Ephemeral,
    });
  }
}
