import { EmbedBuilder } from "discord.js";

/**
 * Create or update an embed displaying all active projects in a specific channel.
 * @param {Client} client - Discord client instance
 * @param {ProjectService} projectService - Instance of ProjectService
 * @param {string} channelId - Discord channel ID
 * @param {string|null} messageId - Existing dashboard message ID (optional)
 * @returns {Promise<string>} - The message ID of the sent/updated message
 */
export async function displayActiveProjects(
  client,
  projectService,
  channelId = "1417419956718534697",
  messageId = null,
) {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel?.isTextBased()) throw new Error("Invalid or inaccessible channel.");

    const projects = await projectService.listActive();

    const embed = new EmbedBuilder()
      .setTitle("📋 Active Project Board")
      .setColor("#0099ff")
      .setTimestamp()
      .setDescription(
        projects.length
          ? `Currently tracking **${projects.length}** active project(s).`
          : "No active projects found.",
      );

    for (const project of projects.slice(0, 10)) {
      const desc = project.description
        ? project.description.slice(0, 150) + (project.description.length > 150 ? "…" : "")
        : "No description provided.";

      const members =
        project.projectMembers
          ?.map((pm) => pm.user?.name || "Unknown")
          .slice(0, 5) // optional limit
          .join(", ") || "No members";

      embed.addFields({
        name: project.name,
        value: `Status: **${project.status}**\nMembers: ${members}\n${desc}`,
        inline: false,
      });
    }

    let message;
    if (messageId) {
      try {
        message = await channel.messages.fetch(messageId);
        await message.edit({ embeds: [embed] });
      } catch {
        message = await channel.send({ embeds: [embed] });
      }
    } else {
      message = await channel.send({ embeds: [embed] });
    }

    return message.id;
  } catch (err) {
    console.error("Failed to display active projects:", err);
    return null;
  }
}
