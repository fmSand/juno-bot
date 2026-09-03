import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { renderLinkManager } from "../../../../../features/projects/links/renderLinkManager.js";

export async function projectLinkDeleteConfirmation(interaction) {
  const [customId, linkId, projectId] = interaction.customId.split(":");
  if (customId === "project_link_delete") {
    console.log(linkId, projectId);
    const { projectService } = interaction.services;
    const { user } = interaction.botContext;
    const projects = await projectService.listByUser(user.id);
    const { content, components } = renderLinkManager({
      projects,
      linkId,
      selectedId: projectId,
      isConfirmingDelete: true,
    });
    await interaction.update({ content, components });
  }
}
