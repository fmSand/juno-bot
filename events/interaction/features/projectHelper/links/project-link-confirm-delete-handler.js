import { MessageFlags } from "discord.js";
import { displayActiveProjects } from "../../../../../utils/displayProjects.js";
import { renderLinkManager } from "../../../../../features/projects/links/renderLinkManager.js";

export async function projectLinkDeleteConfirmHandler(interaction) {
  if (!interaction.customId.startsWith("confirm_project_link_delete:")) return;
  const [customId, linkId, projectId] = interaction.customId.split(":");
  const { projectService, linkService } = interaction.services;
  try {
    const { user } = interaction.botContext;
    const existingProjects = await projectService.listByUser(user.id);
    const selectedProject = existingProjects.find((p) => p.id === projectId);
    const selectedLink = selectedProject?.links.find((l) => l.id == linkId);
    if (!selectedProject || !selectedLink)
      return interaction.update({
        content: "Project or link can't be found.",
      });

    await linkService.delete({ userId: user.id, projectId, linkId });
    const projects = await projectService.listByUser(user.id);
    const { content, components } = renderLinkManager({
      projects: projects,
      selectedId: projectId,
    });

    await interaction.update({ content, components });
    await interaction.followUp({
      content: "Project Link deleted successfully.",
      components: [],
      flags: MessageFlags.Ephemeral,
    });

    await displayActiveProjects(
      interaction.client,
      projectService,
      "1417419956718534697",
      "1435979361009406012",
    );
  } catch (err) {
    console.error("Delete project error:", err);
    await interaction.editReply({
      content: "❌ Something went wrong deleting the project.",
      components: [],
    });
  }
}
