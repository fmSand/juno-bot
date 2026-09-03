import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from "discord.js";

/**
 * Builds the content + components for the Project Manager dashboard.
 * @param {Array} projects - List of user projects
 * @param {string|null} selectedId - Currently selected project ID (optional)
 * @returns {{ content: string, components: any[] }}
 */
export function renderProjectManager(
  projects = [],
  selectedId = null,
  state = { isConfirmingDelete: false },
) {
  let content = "📋 **Project Manager**\n";
  let selected = {};
  if (!projects.length) {
    content += "You don’t have any active projects yet.\n\nClick below to create one!";
  } else if (selectedId) {
    selected = projects.find((p) => p.id === selectedId);
    content += `Currently managing: **${selected?.name || "Unknown"}**\n\nSelect a project or use the actions below.`;
  } else {
    content += "Select a project from the dropdown, then choose an action below.";
  }

  projects.sort((a, b) => {
    // Active first
    if (a.status === "active" && b.status !== "active") return -1;
    if (a.status !== "active" && b.status === "active") return 1;
    return a.name.localeCompare(b.name);
  });

  // --- Top row: global actions ---
  const globalActions = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("project_create")
      .setLabel("➕ Create Project")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("project_dashboard")
      .setLabel("📊 View Dashboard")
      .setStyle(ButtonStyle.Secondary),
  );

  // --- Middle row: dropdown ---
  const projectSelect = new StringSelectMenuBuilder()
    .setCustomId("project_select")
    .setPlaceholder("Select a project to manage…")
    .addOptions(
      projects.map((p) => ({
        label: p.status === "archived" ? p.name + "(archived)" : p.name,
        value: p.id,
        description: p.description?.slice(0, 80) || "No description provided.",
        default: p.id === selectedId, // mark the selected project if any
      })),
    );

  const dropdownRow = new ActionRowBuilder().addComponents(projectSelect);

  const isArchived = selected.status === "archived";

  // --- Bottom row: project actions ---
  const projectActions = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`project_edit:${selectedId}`)
      .setLabel("✏️ Edit Project")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!selectedId),
    new ButtonBuilder()
      .setCustomId(`project_links:${selectedId}`)
      .setLabel("🔗 Manage Links")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!selectedId),
    new ButtonBuilder()
      .setCustomId(`project_members:${selectedId}`)
      .setLabel("👥 Manage Members")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!selectedId),
    new ButtonBuilder()
      .setCustomId(`${isArchived ? "project_restore" : "project_archive"}:${selectedId}`)
      .setLabel(`🗃️ ${isArchived ? "Restore Project" : "Archive Project"}`)
      .setStyle(isArchived ? ButtonStyle.Secondary : ButtonStyle.Danger)
      .setDisabled(!selectedId),
  );

  const { isConfirmingDelete } = state;

  const deleteBtn = new ButtonBuilder()
    .setCustomId(`project_delete:${selectedId}`)
    .setLabel("🗑️ Delete Project")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(!selectedId);

  const confirmBtn = new ButtonBuilder()
    .setCustomId(`confirm_project_delete:${selectedId}`)
    .setLabel("🗑️ Confirm Delete Project")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(!selectedId);

  const cancelBtn = new ButtonBuilder()
    .setCustomId(`cancel_project_delete:${selectedId}`)
    .setLabel("❌ Cancel Delete Project")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(!selectedId);

  // Swap in the correct layout with one conditional
  const dangerZoneActions = new ActionRowBuilder().addComponents(
    isConfirmingDelete ? confirmBtn : deleteBtn,
    ...(isConfirmingDelete ? [cancelBtn] : []),
  );

  const components = projects.length
    ? [globalActions, dropdownRow, projectActions, dangerZoneActions]
    : [globalActions];

  return { content, components };
}
