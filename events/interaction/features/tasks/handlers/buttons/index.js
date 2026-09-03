import { buttonHandlers as crud } from "./crud.js";
import { buttonHandlers as navigation } from "./navigation.js";
import { buttonHandlers as session } from "./session.js";

const handlers = {
  ...crud,
  ...navigation,
  ...session,
};

export async function handleTaskButtons(interaction) {
  const action = interaction.customId.split(":")[1];
  const handler = handlers[action];

  if (!handler) {
    console.warn(`[Task Dashboard] Unknown button action: ${action}`);
    return;
  }

  return handler(interaction);
}
