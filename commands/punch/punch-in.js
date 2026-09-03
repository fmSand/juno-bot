import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { buildClockInUI } from "../../features/session/clockInUI.js";
import { requireNoActiveSession } from "../../guards/index.js";

export default {
  data: new SlashCommandBuilder()
    .setName("clock-in")
    .setDescription("Start tracking your work session"),
  guards: [requireNoActiveSession],

  async execute(interaction) {
    const { taskService } = interaction.services;
    const { user } = interaction.botContext;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const tasks = await taskService.getActiveByUser(user.id, { includeProject: true });
      const payload = buildClockInUI(tasks);

      return interaction.editReply(payload);
    } catch (err) {
      console.error("[Clock-in Command] Error:", err);
      return interaction.editReply({
        content: "Something went wrong..👀",
      });
    }
  },
};
