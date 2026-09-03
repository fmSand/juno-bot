import { selectHandlers as list } from "./list.js";

const handlers = {
  ...list,
};

export async function handleTaskSelects(interaction) {
  const action = interaction.customId.split(":")[1];
  const handler = handlers[action];

  if (!handler) {
    console.warn(`[Task Dashboard] Unknown select action: ${action}`);
    return;
  }

  return handler(interaction);
}
