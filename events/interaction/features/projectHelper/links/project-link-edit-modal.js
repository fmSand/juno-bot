import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";

export async function projectEditLinkModal(interaction) {
  const [customId, linkId, projectId] = interaction.customId.split(":");
  if (customId !== "project_link_edit") return;
  const { user } = interaction.botContext;
  if (!user) return;
  const { linkService } = interaction.services;
  const modal = new ModalBuilder()
    .setCustomId(`edit_project_link_modal:${linkId}:${projectId}`)
    .setTitle("Edit Project Link");

  const link = await linkService.linkById(linkId);

  if (!link) {
    return interaction.reply({
      content: "❌ Link not found or unauthorized.",
      ephemeral: true,
    });
  }

  const kindInput = new TextInputBuilder()
    .setCustomId("kind")
    .setLabel("Kind")
    .setRequired(true)
    .setStyle(TextInputStyle.Short)
    .setValue(link.kind);
  const urlInput = new TextInputBuilder()
    .setCustomId("url")
    .setLabel("URL")
    .setRequired(true)
    .setStyle(TextInputStyle.Short)
    .setValue(link.url);
  const descInput = new TextInputBuilder()
    .setCustomId("description")
    .setLabel("Link Description")
    .setRequired(false)
    .setStyle(TextInputStyle.Paragraph)
    .setValue(link.description ?? "");

  modal.addComponents(
    new ActionRowBuilder().addComponents(kindInput),
    new ActionRowBuilder().addComponents(urlInput),
    new ActionRowBuilder().addComponents(descInput),
  );

  await interaction.showModal(modal);
}
