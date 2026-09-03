const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = "./data/punches.json";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("Check your current punch status"),
  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      
      // Check if file exists
      if (!fs.existsSync(path)) {
        return interaction.reply({
          content: "❌ No punch records found. Use `/start-work` to punch in!",
          ephemeral: true,
        });
      }
      
      // Read punches file
      let punches = {};
      try {
        const fileContent = fs.readFileSync(path, 'utf8');
        punches = fileContent ? JSON.parse(fileContent) : {};
      } catch (error) {
        console.error('Error reading punches file:', error);
        return interaction.reply({
          content: "❌ Error reading punch records. Please try again.",
          ephemeral: true,
        });
      }

      const userPunch = punches[userId];
      
      if (!userPunch || !userPunch.start) {
        return interaction.reply({
          content: "🔴 You are currently **punched out**. Use `/start-work` to punch in!",
          ephemeral: true,
        });
      }

      // Calculate current duration
      const startTime = new Date(userPunch.start);
      const currentTime = new Date();
      const durationMs = currentTime - startTime;
      
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      
      let durationText = "";
      if (hours > 0) {
        durationText = `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes > 1 ? 's' : ''}`;
      } else {
        durationText = `${minutes} minute${minutes > 1 ? 's' : ''}`;
      }

      await interaction.reply({
        content: `🟢 You are currently **punched in**!\n⏰ Started: ${startTime.toLocaleString()}\n⏱️ Duration: ${durationText}\n\nUse \`/end-work\` to punch out when you're done!`,
        ephemeral: true,
      });
      
    } catch (error) {
      console.error('Error in status command:', error);
      await interaction.reply({
        content: '❌ An error occurred while checking status. Please try again.',
        ephemeral: true,
      });
    }
  },
}; 