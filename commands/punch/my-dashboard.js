import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { buildMyDashboardUI, buildErrorUI } from "../../features/session/myDashboardUI.js";

export default {
  data: new SlashCommandBuilder()
    .setName("my-dashboard")
    .setDescription("View your monthly work stats"),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const { sessionService } = interaction.services;
      const { user } = interaction.botContext;
      const stats = await sessionService.getMonthStats(user.id);
      const payload = buildMyDashboardUI(user, stats);

      await interaction.editReply(payload);
    } catch (err) {
      console.error("[my-dashboard] Error:", err);
      await interaction.editReply(buildErrorUI());
    }
  },
};
