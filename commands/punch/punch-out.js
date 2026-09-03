import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { buildClockOutMessagePayload } from "../../features/session/messageBuilder.js";
import { requireActiveSession } from "../../guards/index.js";
import { cancelTimer } from "../../features/session/timerManager.js";
import { requestDashboardUpdate } from "../../features/liveDashboard/dashboardUpdater.js";

export default {
  data: new SlashCommandBuilder()
    .setName("clock-out")
    .setDescription("End your current work session"),
  guards: [requireActiveSession],

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const { sessionService, taskService } = interaction.services;
      const { user, session } = interaction.botContext;

      if (session) {
        cancelTimer(session.id);
      }

      const result = await sessionService.end(user.id);
      const tasksWorkedOn = await taskService.getTasksForSession(result.session.id);

      const payload = buildClockOutMessagePayload(result, { tasksWorkedOn });
      await interaction.editReply(payload);
      requestDashboardUpdate(interaction.client);
    } catch (err) {
      console.error("Clock-out error:", err);
      await interaction.editReply("Something went wrong..👀");
    }
  },
};
