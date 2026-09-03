import { Events } from "discord.js";
import { handleEvent } from "./handlers/handleEvent.js";
import { handleChatInputCommand } from "./handlers/command.js";
import { buttonHandlers } from "./handlers/button.js";
import { modalSubmitHandlers } from "./handlers/modal.js";
import { selectHandlers } from "./handlers/select.js";

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        await handleChatInputCommand(interaction);
        return;
      }

      if (interaction.isButton()) {
        await handleEvent(interaction, buttonHandlers);
        return;
      }

      if (interaction.isModalSubmit()) {
        await handleEvent(interaction, modalSubmitHandlers);
        return;
      }

      if (interaction.isAnySelectMenu()) {
        await handleEvent(interaction, selectHandlers);
        return;
      }
    } catch (error) {
      console.error("[InteractionCreate] Unhandled error:", error);
    }
  },
};
