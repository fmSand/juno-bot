import { MessageFlags } from "discord.js";
import { displayActiveProjects } from "../../../../utils/displayProjects.js";
import { renderProjectManager } from "../../../../utils/renderProjectManager.js";

export async function projectRestoreHandler(interaction) {
  if (!interaction.customId.startsWith("project_restore:")) return;
  const projectId = interaction.customId.split(":")[1];
  const { projectService } = interaction.services;
  try {
    console.log("restore");
    const { user } = interaction.botContext;
    await projectService.restore({ id: projectId, userId: user.id });

    const projects = await projectService.listByUser(user.id);
    const { content, components } = renderProjectManager(projects, projectId);
    await interaction.update({ content, components });
    await interaction.followUp({
      content: "Project restored successfully.",
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
    console.error("Restore project error:", err);
    await interaction.editReply({
      content: "❌ Something went wrong restoring the project.",
      components: [],
    });
  }
}
