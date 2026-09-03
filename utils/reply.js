import { MessageFlags } from "discord.js";

export async function sendReply(interaction, options = {}, { ephemeral = false } = {}) {
  const data = typeof options === "string" ? { content: options } : (options ?? {});
  if (ephemeral) data.flags = MessageFlags.Ephemeral;

  if (!data.content && !data.embeds && !data.components) {
    data.content = "An unknown error occurred.";
  }

  if (interaction.deferred) return interaction.editReply(data);
  if (interaction.replied) return interaction.followUp(data);
  return interaction.reply(data);
}

export async function replyEphemeral(interaction, options) {
  return sendReply(interaction, options, { ephemeral: true });
}
