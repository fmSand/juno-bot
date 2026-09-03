import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from "discord.js";
import { sendReply } from "../../../utils/reply.js";

export async function handleChatInputCommand(interaction) {
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.warn(`❌ No command matching ${interaction.commandName} found.`);
    return;
  }

  try {
    if (!command.skipContext) {
      const botContext = await buildInteractionContext(interaction);
      if (!botContext) return;
      interaction.botContext = botContext;
    }

    if (command.guards?.length) {
      const passed = await runGuards(command.guards, interaction);
      if (!passed) return;
    }

    await command.execute(interaction);
  } catch (error) {
    console.error("interactionCreate (chat input) error:", error);
    await sendReply(interaction, "Something broke.", { ephemeral: true });
  }
}

/* ---------- helpers ---------- */

async function buildInteractionContext(interaction) {
  const { userService, sessionService } = interaction.services;

  const user = await userService.getOneDiscordId(interaction.user.id);

  if (!user) {
    await promptUserToCreateProfile(interaction);
    return null;
  }

  const session = await sessionService.getOneActive(user.id);

  return { user, session };
}

async function promptUserToCreateProfile(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const button = new ButtonBuilder()
    .setCustomId("create_user_modal_button")
    .setLabel("Create User")
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(button);

  await interaction.editReply({
    content: "You're not in the database yet. Click below to create a profile.",
    components: [row],
  });
}

async function runGuards(guards, interaction) {
  for (const guard of guards) {
    const passed = await guard(interaction);
    if (!passed) return false;
  }
  return true;
}
