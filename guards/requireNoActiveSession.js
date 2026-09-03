import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { replyEphemeral } from "../utils/reply.js";

export async function requireNoActiveSession(interaction) {
  if (!interaction.botContext?.session) return true;

  const clockOutButton = new ButtonBuilder()
    .setCustomId("clock_out_button")
    .setLabel("Clock Out")
    .setStyle(ButtonStyle.Danger)
    .setEmoji("🛑");

  const row = new ActionRowBuilder().addComponents(clockOutButton);

  await replyEphemeral(interaction, {
    content: "You're already clocked in.",
    components: [row],
  });
  return false;
}
