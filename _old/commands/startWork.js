const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = "./data/punches.json";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("start-work")
    .setDescription("Punch in and start your shift"),
  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      
      // Ensure the data directory exists
      const dataDir = "./data";
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Read existing punches or create new file
      let punches = {};
      if (fs.existsSync(path)) {
        try {
          const fileContent = fs.readFileSync(path, 'utf8');
          punches = fileContent ? JSON.parse(fileContent) : {};
        } catch (error) {
          console.error('Error reading punches file:', error);
          punches = {};
        }
      }
      
      // Check if user is already punched in
      if (punches[userId] && punches[userId].start) {
        return interaction.reply({
          content: `❌ You're already punched in! Use \`/end-work\` to punch out first.`,
          ephemeral: true,
        });
      }
      
      // Punch in the user
      punches[userId] = { 
        start: new Date().toISOString(),
        username: interaction.user.username
      };
      
      // Write to file
      fs.writeFileSync(path, JSON.stringify(punches, null, 2));
      
      await interaction.reply({
        content: `✅ Welcome ${interaction.user.username}, you're now punched in! Let's get this party started! 🎉`,
        ephemeral: false,
      });
      
    } catch (error) {
      console.error('Error in startWork command:', error);
      await interaction.reply({
        content: '❌ An error occurred while punching in. Please try again.',
        ephemeral: true,
      });
    }
  },
};
