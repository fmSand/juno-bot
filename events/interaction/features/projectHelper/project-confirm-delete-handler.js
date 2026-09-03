import { MessageFlags } from "discord.js";
import { displayActiveProjects } from "../../../../utils/displayProjects.js";
import { renderProjectManager } from "../../../../utils/renderProjectManager.js";
import { replyEphemeral } from "../../../../utils/reply.js";
export async function projectDeleteConfirmHandler(interaction) {
  if (!interaction.customId.startsWith("confirm_project_delete:")) return;
  const projectId = interaction.customId.split(":")[1];
  const { projectService } = interaction.services;
  try {
    const { user } = interaction.botContext;
    await projectService.delete({ id: projectId, userId: user.id });
    const projects = await projectService.listByUser(user.id);
    const { content, components } = renderProjectManager(projects);
    await interaction.update({ content, components });
    await interaction.followUp({
      content: "Project deleted successfully.",
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
    await replyEphemeral(interaction, "❌ Something went wrong deleting the project.");
  }
}
