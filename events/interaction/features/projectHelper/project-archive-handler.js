import { MessageFlags } from "discord.js";
import { displayActiveProjects } from "../../../../utils/displayProjects.js";
import { renderProjectManager } from "../../../../utils/renderProjectManager.js";

export async function projectArchiveHandler(interaction) {
  if (!interaction.customId.startsWith("project_archive:")) return;
  const projectId = interaction.customId.split(":")[1];
  const { projectService } = interaction.services;
  try {
    const { user } = interaction.botContext;
    await projectService.archive({ id: projectId, userId: user.id });

    const projects = await projectService.listByUser(user.id);
    const { content, components } = renderProjectManager(projects, projectId);
    await interaction.update({ content, components });
    await interaction.followUp({
      content: "Project archived successfully.",
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
    console.error("Archived project error:", err);
    await interaction.editReply({
      content: "❌ Something went wrong archiving the project.",
      components: [],
    });
  }
}
