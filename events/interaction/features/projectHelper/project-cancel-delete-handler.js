import { renderProjectManager } from "../../../../utils/renderProjectManager.js";

export async function projectDeleteCancelHandler(interaction) {
  if (interaction.customId.startsWith("cancel_project_delete:")) {
    const projectId = interaction.customId.split(":")[1];
    const { projectService } = interaction.services;
    const { user } = interaction.botContext;
    const projects = await projectService.listByUser(user.id);
    const { content, components } = renderProjectManager(projects, projectId);
    await interaction.update({ content, components });
  }
}
