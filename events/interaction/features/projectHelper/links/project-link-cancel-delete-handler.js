import { renderLinkManager } from "../../../../../features/projects/links/renderLinkManager.js";

export async function projectLinkDeleteCancelHandler(interaction) {
  if (interaction.customId.startsWith("cancel_project_link_delete:")) {
    const [customId, linkId, projectId] = interaction.customId.split(":");
    const { projectService } = interaction.services;
    const { user } = interaction.botContext;
    const projects = await projectService.listByUser(user.id);
    const { content, components } = renderLinkManager({
      projects,
      linkId,
      selectedId: projectId,
    });
    await interaction.update({ content, components });
  }
}
