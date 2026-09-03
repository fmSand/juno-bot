import { MessageFlags } from "discord.js";
import { displayActiveProjects } from "../../../../../utils/displayProjects.js";
import { renderLinkManager } from "../../../../../features/projects/links/renderLinkManager.js";

export async function handleProjectLinkCreateModal(interaction) {
  if (!interaction.isModalSubmit()) return;
  const [customId, projectId] = interaction.customId.split(":");
  if (customId !== "create_project_link_modal") return;
  const { user } = interaction.botContext;
  if (!user) return;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    const { projectService, linkService } = interaction.services;
    const existingProjects = await projectService.listByUser(user.id);
    const selectedProject = existingProjects.find((p) => p.id === projectId);
    if (!selectedProject) return;

    const kind = interaction.fields.getTextInputValue("kind").trim();
    const url = interaction.fields.getTextInputValue("url").trim();
    const description = interaction.fields.getTextInputValue("description").trim();

    let validUrl = false;
    try {
      // Might be a bit lazy as the URL constructor requires a protocol (like http:// or https://)
      new URL(url);
      validUrl = true;
    } catch (e) {
      validUrl = false;
    }

    if (!validUrl) {
      await interaction.followUp({
        content:
          "❌ The URL you provided is invalid. Please ensure it includes the full protocol (e.g., https://example.com).",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (
      selectedProject.links &&
      selectedProject.links.some((l) => l.kind.toLowerCase() === kind.toLowerCase())
    ) {
      await interaction.followUp({
        content: "⚠️ You already have a link of that kind for this project.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const link = await linkService.create({
      projectId,
      kind,
      url,
      description,
      userId: user.id,
    });
    if (!selectedProject.links) selectedProject.links = [];
    selectedProject.links.push(link);

    const { content, components } = renderLinkManager({
      projects: existingProjects,
      selectedId: projectId,
      linkId: link.id,
    });

    await interaction.editReply({ content, components });
    await interaction.followUp({
      content: `✅ Project link, **${link?.kind}** created successfully.`,
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
    await interaction.editReply("Something went wrong while creating the project link.");
  }
}
