import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";

export async function handleCreateUserButton(interaction) {
  const modal = new ModalBuilder().setCustomId("create_user_modal").setTitle("Create User");

  const nameInput = new TextInputBuilder()
    .setCustomId("name")
    .setLabel("Name")
    .setRequired(true)
    .setStyle(TextInputStyle.Short);

  const githubInput = new TextInputBuilder()
    .setCustomId("gh")
    .setLabel("GitHub username (optional)")
    .setRequired(false)
    .setStyle(TextInputStyle.Short);

  modal.addComponents(
    new ActionRowBuilder().addComponents(nameInput),
    new ActionRowBuilder().addComponents(githubInput),
  );

  await interaction.showModal(modal);
}
