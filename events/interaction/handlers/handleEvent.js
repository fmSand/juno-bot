import { appendContext } from "../../../utils/appendContext.js";

export async function handleEvent(interaction, handlers) {
  const key = interaction.customId.split(":")[0];

  const handler = handlers[key];
  if (!handler) {
    console.warn(`Unhandled interaction: ${key}`);
    return;
  }

  await appendContext(interaction, handler.context);

  try {
    return await handler.run(interaction);
  } catch (err) {
    console.error(`Interaction error (${key}):`, err);
  }
}
