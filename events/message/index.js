import { Events } from "discord.js";
import { triggers } from "./triggers.js";

export default {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;

    for (const trigger of triggers) {
      if (trigger.match(message)) {
        await trigger.run(message);
        return;
      }
    }
  },
};
