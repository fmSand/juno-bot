import { modalHandlers as crud } from "./crud.js";
import { modalHandlers as session } from "./session.js";

const handlers = {
  ...crud,
  ...session,
};

export async function handleTaskModals(interaction) {
  const action = interaction.customId.split(":")[1];
  const handler = handlers[action];

  if (!handler) {
    console.warn(`[Task Dashboard] Unknown modal action: ${action}`);
    return;
  }

  return handler(interaction);
}
