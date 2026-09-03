import { MessageFlags } from "discord.js";

export async function handleCreateUserModal(interaction) {
  const { userService } = interaction.services;

  const name = interaction.fields.getTextInputValue("name").trim();
  const gh = interaction.fields.getTextInputValue("gh").trim();

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const existing = await userService.getOneDiscordId(interaction.user.id);

    if (existing) {
      return interaction.editReply("User already exists.");
    }

    await userService.create({
      discordId: interaction.user.id,
      githubUsername: gh || null,
      name,
    });

    return await interaction.editReply("✅ User created successfully.");
  } catch (err) {
    console.error("User creation error:", err);
    return await interaction.editReply("Errmmm you broke something wasn't me!");
  }
}
