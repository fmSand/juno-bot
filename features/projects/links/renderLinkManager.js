import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from "discord.js";

export function renderLinkManager({
  projects = [],
  selectedId = null,
  linkId = null,
  isConfirmingDelete = false,
}) {
  let content = "📋 **Project Links Manager**\n";
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

  // --- Top row: dropdown ---
  const projectSelect = new StringSelectMenuBuilder()
    .setCustomId("link_project_select")
    .setPlaceholder("Select a project to manage…")
    .addOptions(
      projects.map((p) => ({
        label: p.status === "archived" ? p.name + "(archived)" : p.name,
        value: p.id,
        description: p.description?.slice(0, 80) || "No description provided.",
        default: p.id === selectedId, // mark the selected project if any
      })),
    );

  const projectDropdownRow = new ActionRowBuilder().addComponents(projectSelect);

  const components = [projectDropdownRow];

  // --- Conditional Link-Specific Components ---
  if (selected) {
    const hasLinks = selected.links && selected.links.length > 0;
    let linkDropdownRow = null;
    if (hasLinks) {
      const linkSelect = new StringSelectMenuBuilder()
        .setCustomId(`project_links_select:${selectedId}`)
        .setPlaceholder("Select a link to manage…")
        .addOptions(
          selected.links.map((l) => ({
            label: `${l.kind}: ${l.url}`,
            value: String(l.id),
            description: l.description?.slice(0, 80) || "No description provided.",
            default: l.id == linkId,
          })),
        );
      linkDropdownRow = new ActionRowBuilder().addComponents(linkSelect);
    } else {
      content += "\n⚠️ **No links found.** Use the 'Add Link' button below.";
    }

    // --- 4. Link Actions ---
    const linkActions = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`project_link_create:${selectedId}`)
        .setLabel("➕ Add Link")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`project_link_edit:${linkId}:${selectedId}`) // Use project_link_edit for clarity
        .setLabel("✏️ Edit Link")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!linkId),
    );
    console.log(selectedId);
    // --- 5. Delete/Confirm/Cancel Buttons ---
    const deleteBtn = new ButtonBuilder()
      .setCustomId(`project_link_delete:${linkId}:${selectedId}`)
      .setLabel("🗑️ Delete Link")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(!linkId);

    const confirmBtn = new ButtonBuilder()
      .setCustomId(`confirm_project_link_delete:${linkId}:${selectedId}`)
      .setLabel("🗑️ Confirm Delete")
      .setStyle(ButtonStyle.Danger);

    const cancelBtn = new ButtonBuilder()
      .setCustomId(`cancel_project_link_delete:${linkId}:${selectedId}`)
      .setLabel("❌ Cancel")
      .setStyle(ButtonStyle.Secondary);

    const dangerZoneActions = new ActionRowBuilder().addComponents(
      isConfirmingDelete ? confirmBtn : deleteBtn,
      ...(isConfirmingDelete ? [cancelBtn] : []),
    );

    // --- Assemble Final Components ---
    if (linkDropdownRow) components.push(linkDropdownRow);
    components.push(linkActions);
    components.push(dangerZoneActions);
  }

  return { content, components };
}
