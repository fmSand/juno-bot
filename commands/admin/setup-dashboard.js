import { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } from "discord.js";
import { buildLiveDashboardUI } from "../../features/liveDashboard/dashboardUI.js";

export default {
  data: new SlashCommandBuilder()
    .setName("setup-dashboard")
    .setDescription("Initialize the live dashboard in this channel"),
  //.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  // add before deploying our bot to juniors server
  // https://discordjs.guide/legacy/slash-commands/permissions

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const { sessionService, dashboardService } = interaction.services;
      const existing = await dashboardService.getByChannel(interaction.channelId);
      if (existing) {
        return interaction.editReply(
          "⚠️ Dashboard already exists in this channel. Delete the old message first.",
        );
      }

      const [activeSessions, workedToday] = await Promise.all([
        sessionService.getAllActive(),
        sessionService.getWorkedToday(),
      ]);

      const payload = buildLiveDashboardUI({ activeSessions, workedToday });
      const dashboardMessage = await interaction.channel.send(payload);
      await dashboardService.upsert(interaction.channelId, dashboardMessage.id);

      await interaction.editReply("✅ Dashboard created! It will update automatically.");
    } catch (err) {
      console.error("[Setup Dashboard] Error:", err);
      await interaction.editReply("Failed to create dashboard.");
    }
  },
};
