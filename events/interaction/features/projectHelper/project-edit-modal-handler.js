import { MessageFlags } from "discord.js";
import { displayActiveProjects } from "../../../../utils/displayProjects.js";
import { renderProjectManager } from "../../../../utils/renderProjectManager.js";

export async function handleProjectEditModal(interaction) {
  if (!interaction.isModalSubmit()) return;
  const [customId, projectId] = interaction.customId.split(":");
  if (customId !== "edit_project_modal") return;
  if (!projectId) return;
  if (!interaction.botContext.user) return;

  const { projectService } = interaction.services;
  const name = interaction.fields.getTextInputValue("name").trim();
  const description = interaction.fields.getTextInputValue("description").trim();
  await interaction.deferUpdate({ flags: MessageFlags.Ephemeral });

  try {
    const { user } = interaction.botContext;
    const existingProjects = await projectService.listByUser(user.id);
    const isDuplicate = existingProjects.some(
      (p) => p.name.toLowerCase() === name.toLowerCase() && String(p.id) !== String(projectId),
    );
    if (isDuplicate) {
      await interaction.followUp({
        content:
          "❌ You already have another project with that name. Please choose a different one.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const updatedProject = await projectService.update({
      id: projectId,
      userId: user.id,
      args: {
        name,
        description,
      },
    });

    const projects = await projectService.listByUser(user.id);
    const { content, components } = renderProjectManager(projects, projectId);
    await interaction.editReply({
      content,
      components,
      flags: MessageFlags.Ephemeral,
    });
    await interaction.followUp({
      content: `✅ Project **${updatedProject?.name}** updated successfully.`,
      flags: MessageFlags.Ephemeral,
    });
    await displayActiveProjects(
      interaction.client,
      projectService,
      "1417419956718534697",
      "1435979361009406012",
    );
  } catch (err) {
    console.error("Edit project modal error:", err);
    await interaction.editReply({
      content: `Something went wrong while editing the project: ${err.message || "Unknown error."}`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
