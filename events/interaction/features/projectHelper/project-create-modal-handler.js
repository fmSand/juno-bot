import { MessageFlags } from "discord.js";
import { displayActiveProjects } from "../../../../utils/displayProjects.js";
import { renderProjectManager } from "../../../../utils/renderProjectManager.js";

export async function handleProjectCreateModal(interaction) {
  if (!interaction.isModalSubmit()) return;
  if (interaction.customId !== "create_project_modal") return;
  const user = interaction.botContext.user;
  if (!user) return;
  const { projectService } = interaction.services;
  const name = interaction.fields.getTextInputValue("name").trim();
  const description = interaction.fields.getTextInputValue("description").trim();

  try {
    const existingProjects = await projectService.listByUser(user.id);
    if (existingProjects.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      return interaction.reply({
        content: "You already have a project with that name.",
        flags: MessageFlags.Ephemeral,
      });
    }
    await interaction.deferUpdate({ flags: MessageFlags.Ephemeral });

    const project = await projectService.create({
      name,
      description,
      ownerId: user.id,
    });

    const projects = await projectService.listByUser(user.id);
    const { content, components } = renderProjectManager(projects, project.id);
    await interaction.editReply({ content, components });
    await interaction.followUp({
      content: `✅ Project **${project?.name}** created successfully.`,
      flags: MessageFlags.Ephemeral,
    });
    await displayActiveProjects(
      interaction.client,
      projectService,
      "1417419956718534697",
      "1435979361009406012",
    );
  } catch (err) {
    console.error("Create project modal error:", err);
    await interaction.editReply({
      content: "Something went wrong while creating the project.",
      flags: MessageFlags.Ephemeral,
    });
  }
}
