import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";
import { renderProjectManager } from "../../utils/renderProjectManager.js";

export default {
  data: new SlashCommandBuilder()
    .setName("projects")
    .setDescription("Manage and view your active projects."),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const { projectService } = interaction.services;
    const { user } = interaction.botContext;
    const projects = await projectService.listByUser(user.id);

    // --- No projects yet ---
    if (!projects.length) {
      const createRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("project_create")
          .setLabel("➕ Create New Project")
          .setStyle(ButtonStyle.Success),
      );

      return interaction.editReply({
        content:
          "📋 **Project Manager**\nYou don’t have any projects yet.\n\nClick below to create one!",
        components: [createRow],
      });
    }

    const { content, components } = renderProjectManager(projects);
    await interaction.editReply({ content, components });
  },
};
