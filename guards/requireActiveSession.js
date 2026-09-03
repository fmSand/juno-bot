import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { replyEphemeral } from "../utils/reply.js";

export async function requireActiveSession(interaction) {
  if (interaction.botContext?.session) return true;

  const clockInButton = new ButtonBuilder()
    .setCustomId("clock_in_button")
    .setLabel("Clock In")
    .setStyle(ButtonStyle.Success)
    .setEmoji("⏱️");

  const row = new ActionRowBuilder().addComponents(clockInButton);

  await replyEphemeral(interaction, {
    content: "You're not clocked in.",
    components: [row],
  });
  return false;
}
