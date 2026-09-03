import { renderProjectManager } from "../../../../utils/renderProjectManager.js";

export async function projectSelectHandler(interaction) {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId !== "project_select") return;
  const selectedId = interaction.values[0];
  const { projectService } = interaction.services;
  const { user } = interaction.botContext;
  const projects = await projectService.listByUser(user.id);
  const { content, components } = renderProjectManager(projects, selectedId);
  await interaction.update({ content, components });
}
