import { buildMyDashboardUI } from "../../../../features/session/myDashboardUI.js";

export async function handleMyDashboardSelects(interaction) {
  const [, action] = interaction.customId.split(":");

  if (action !== "month") {
    console.warn(`[my-dashboard] Unknown select action: ${action}`);
    return;
  }

  await interaction.deferUpdate();

  try {
    const { user } = interaction.botContext;
    const { sessionService } = interaction.services;
    const value = interaction.values[0];
    const [year, month] = value.split("-").map(Number);
    const stats = await sessionService.getMonthStats(user.id, { year, month });
    const payload = buildMyDashboardUI(user, stats);

    await interaction.editReply(payload);
  } catch (err) {
    console.error("[my-dashboard] Month select error:", err);
    await interaction.editReply({
      content: "Something went wrong loading stats for that month.",
    });
  }
}
