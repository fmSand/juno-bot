const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = "./data/punches.json";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("end-work")
    .setDescription("Punch out and end your shift"),
  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      
      // Check if file exists
      if (!fs.existsSync(path)) {
        return interaction.reply({
          content: "❌ No punch records found. Use `/start-work` to punch in first!",
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

      const startTime = punches[userId]?.start;
      if (!startTime) {
        return interaction.reply({
          content: "❌ You need to punch in first with `/start-work`!",
          ephemeral: true,
        });
      }

      const endTime = new Date();
      const start = new Date(startTime);
      const durationMs = endTime - start;
      
      // Calculate hours and minutes
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      
      // Format duration string
      let durationText = "";
      if (hours > 0) {
        durationText = `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes > 1 ? 's' : ''}`;
      } else {
        durationText = `${minutes} minute${minutes > 1 ? 's' : ''}`;
      }

      // Store the completed shift data (optional - you might want to keep this for records)
      const completedShift = {
        start: startTime,
        end: endTime.toISOString(),
        duration: durationMs,
        username: interaction.user.username
      };
      
      // Remove the active punch
      delete punches[userId];

      // Write updated punches to file
      fs.writeFileSync(path, JSON.stringify(punches, null, 2));

      await interaction.reply({
        content: `✅ Great work, ${interaction.user.username}! You worked for ${durationText} 💪`,
        ephemeral: false,
      });
      
    } catch (error) {
      console.error('Error in endWork command:', error);
      await interaction.reply({
        content: '❌ An error occurred while punching out. Please try again.',
        ephemeral: true,
      });
    }
  },
};
