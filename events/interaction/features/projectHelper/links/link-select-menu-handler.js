import { renderLinkManager } from "../../../../../features/projects/links/renderLinkManager.js";

export async function projectLinkSelectHandler(interaction) {
  try {
    if (!interaction.isStringSelectMenu()) return;
    const [customId, projectId] = interaction.customId.split(":");
    if (customId !== "project_links_select") return;
    const linkId = interaction.values[0];
    const { projectService } = interaction.services;
    const { user } = interaction.botContext;
    const projects = await projectService.listByUser(user.id);
    const { content, components } = renderLinkManager({ projects, selectedId: projectId, linkId });
    await interaction.update({ content, components });
  } catch (error) {
    console.log(error);
  }
}
