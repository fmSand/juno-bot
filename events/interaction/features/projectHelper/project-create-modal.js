import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";

export async function projectCreateModal(interaction) {
  if (interaction.customId !== "project_create") return;
  if (!interaction.botContext.user) return;

  const modal = new ModalBuilder()
    .setCustomId("create_project_modal")
    .setTitle("Create New Project");

  const nameInput = new TextInputBuilder()
    .setCustomId("name")
    .setLabel("Project Name")
    .setRequired(true)
    .setStyle(TextInputStyle.Short);

  const descInput = new TextInputBuilder()
    .setCustomId("description")
    .setLabel("Project Description")
    .setRequired(false)
    .setStyle(TextInputStyle.Paragraph);

  modal.addComponents(
    new ActionRowBuilder().addComponents(nameInput),
    new ActionRowBuilder().addComponents(descInput),
  );

  await interaction.showModal(modal);
}
