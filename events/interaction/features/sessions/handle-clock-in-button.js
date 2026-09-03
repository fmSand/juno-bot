import { MessageFlags } from "discord.js";
import { buildClockInUI } from "../../../../features/session/clockInUI.js";

export async function handleClockInButton(interaction) {
  const { user } = interaction.botContext;
  const { taskService } = interaction.services;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    const tasks = await taskService.getActiveByUser(user.id, { includeProject: true });
    const payload = buildClockInUI(tasks);
    await interaction.editReply(payload);
  } catch (err) {
    console.error("[Clock-in Button] Error:", err);
    await interaction.editReply({
      content: "Something went wrong..idk.",
    });
  }
}
