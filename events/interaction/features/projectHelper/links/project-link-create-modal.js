import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";

export async function projectCreateLinkModal(interaction) {
  const [customId, projectId] = interaction.customId.split(":");
  if (customId !== "project_link_create") return;
  if (!interaction.botContext.user) return;
  const modal = new ModalBuilder()
    .setCustomId(`create_project_link_modal:${projectId}`)
    .setTitle("Create New Project Link");

  const kindInput = new TextInputBuilder()
    .setCustomId("kind")
    .setLabel("Kind")
    .setRequired(true)
    .setStyle(TextInputStyle.Short);
  const urlInput = new TextInputBuilder()
    .setCustomId("url")
    .setLabel("URL")
    .setRequired(true)
    .setStyle(TextInputStyle.Short);
  const descInput = new TextInputBuilder()
    .setCustomId("description")
    .setLabel("Link Description")
    .setRequired(false)
    .setStyle(TextInputStyle.Paragraph);

  modal.addComponents(
    new ActionRowBuilder().addComponents(kindInput),
    new ActionRowBuilder().addComponents(urlInput),
    new ActionRowBuilder().addComponents(descInput),
  );

  await interaction.showModal(modal);
}
