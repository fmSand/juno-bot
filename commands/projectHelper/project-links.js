import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";
import { renderLinkManager } from "../../features/projects/links/renderLinkManager.js";

export default {
  data: new SlashCommandBuilder()
    .setName("projects-links")
    .setDescription("Manage your projects links"),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const { projectService, userService } = interaction.services;
    const user = await userService.getOneDiscordId(interaction.user.id);
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

    const { content, components } = renderLinkManager({ projects });
    await interaction.editReply({ content, components });
  },
};
