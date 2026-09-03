import { MessageFlags } from "discord.js";
import { displayActiveProjects } from "../../../../../utils/displayProjects.js";
import { renderLinkManager } from "../../../../../features/projects/links/renderLinkManager.js";

export async function handleProjectLinkEditModal(interaction) {
  if (!interaction.isModalSubmit()) return;
  const [customId, linkId, projectId] = interaction.customId.split(":");
  if (customId !== "edit_project_link_modal") return;
  const { user } = interaction.botContext;
  if (!user) return;
  await interaction.deferUpdate();
  try {
    const { projectService, linkService } = interaction.services;
    const existingProjects = await projectService.listByUser(user.id);
    const selectedProject = existingProjects.find((p) => p.id === projectId);
    const selectedLink = selectedProject?.links.find((l) => l.id == linkId);
    if (!selectedProject || !selectedLink)
      return interaction.update({
        content: "Project or link can't be found.",
      });
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
      selectedLink.kind !== kind &&
      selectedProject.links.some(
        (l) => String(l.id) !== String(linkId) && l.kind.toLowerCase() === kind.toLowerCase(),
      )
    ) {
      await interaction.followUp({
        content: "⚠️ You already have a link of that kind for this project.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const link = await linkService.update({
      linkId,
      projectId,
      args: {
        kind,
        url,
        description,
      },
      userId: user.id,
    });

    selectedLink.kind = link.kind;
    selectedLink.url = link.url;
    selectedLink.description = link.description;

    const { content, components } = renderLinkManager({
      projects: existingProjects,
      selectedId: projectId,
      linkId: link.id,
    });

    await interaction.editReply({ content, components });
    await interaction.followUp({
      content: `✅ Project link, **${link?.kind}** updated successfully.`,
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
