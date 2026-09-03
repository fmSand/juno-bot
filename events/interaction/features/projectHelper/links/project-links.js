import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from "discord.js";
import { renderLinkManager } from "../../../../../features/projects/links/renderLinkManager.js";

export async function projectLinkManager(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    const [customId, projectId] = interaction.customId.split(":");
    const { user } = interaction.botContext;
    if (customId !== "project_links") return;
    if (!user) return;
    const { projectService } = interaction.services;
    const projects = await projectService.listByUser(user.id);
    const { content, components } = renderLinkManager({ projects, selectedId: projectId });
    await interaction.editReply({
      content,
      components,
    });
  } catch (error) {
    interaction.editReply("something went wrong!");
  }
}
