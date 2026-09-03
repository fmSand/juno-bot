import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
} from "discord.js";

export async function projectEditModal(interaction) {
  const [customId, projectId] = interaction.customId.split(":");
  if (customId !== "project_edit") return;
  if (!interaction.botContext.user) return;
  if (!projectId) {
    return interaction.reply({
      content: "Please select a project before attempting to edit.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const { projectService } = interaction.services;
  const projectToEdit = await projectService.getById(projectId);

  if (!projectToEdit) {
    return interaction.reply({
      content: "Could not find the project to edit.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const modal = new ModalBuilder()
    .setCustomId(`edit_project_modal:${projectId}`)
    .setTitle(`Edit: ${projectToEdit.name}`);

  const nameInput = new TextInputBuilder()
    .setCustomId("name")
    .setLabel("Project Name")
    .setRequired(true)
    .setStyle(TextInputStyle.Short)
    .setValue(projectToEdit.name);

  const descInput = new TextInputBuilder()
    .setCustomId("description")
    .setLabel("Project Description")
    .setRequired(false)
    .setStyle(TextInputStyle.Paragraph)
    .setValue(projectToEdit.description || "");

  modal.addComponents(
    new ActionRowBuilder().addComponents(nameInput),
    new ActionRowBuilder().addComponents(descInput),
  );

  await interaction.showModal(modal);
}
