import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("dadjoke")
    .setDescription("Replies with a random dad joke."),

  async execute(interaction) {
    console.log("dad joke");
    await interaction.deferReply(); // acknowledges immediately

    try {
      const res = await fetch("https://icanhazdadjoke.com/", {
        headers: { Accept: "application/json" },
      });
      const data = await res.json();

      await interaction.editReply(data.joke || "No joke found.");
    } catch (err) {
      await interaction.editReply("Couldn't fetch a joke. The void wins again.");
    }
  },
};
