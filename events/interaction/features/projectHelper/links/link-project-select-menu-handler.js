import { renderLinkManager } from "../../../../../features/projects/links/renderLinkManager.js";

export async function linkProjectSelectHandler(interaction) {
  try {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== "link_project_select") return;
    const selectedId = interaction.values[0];
    const { projectService } = interaction.services;
    const { user } = interaction.botContext;
    const projects = await projectService.listByUser(user.id);
    const { content, components } = renderLinkManager({ projects, selectedId });
    await interaction.update({ content, components });
  } catch (error) {
    console.log(error);
  }
}
