const { SlashCommandBuilder } = require("discord.js");
const { summarizeMessages } = require("../utils/aiSummary");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("test-sample")
    .setDescription("Test summary with sample messages"),

  async execute(interaction) {
    await interaction.deferReply();

    // Create sample message objects that mimic Discord.js message structure
    const sampleMessages = [
      {
        content: "Working on user authentication system.",
        author: { username: "Alice" },
        createdAt: new Date(),
        embeds: [],
        attachments: new Map()
      },
      {
        content: "I can help test it tomorrow.",
        author: { username: "Bob" },
        createdAt: new Date(),
        embeds: [],
        attachments: new Map()
      },
      {
        content: "Focus on login flow and password reset.",
        author: { username: "Alice" },
        createdAt: new Date(),
        embeds: [],
        attachments: new Map()
      },
      {
        content: "Found UI improvements for the frontend.",
        author: { username: "Charlie" },
        createdAt: new Date(),
        embeds: [],
        attachments: new Map()
      },
      {
        content: "Let's meet tomorrow to discuss both.",
        author: { username: "David" },
        createdAt: new Date(),
        embeds: [],
        attachments: new Map()
      }
    ];

    try {
      console.log("🧪 Testing with sample messages...");
      const summary = await summarizeMessages(sampleMessages, interaction);
      
      const sampleText = sampleMessages.map(msg => `[${msg.author.username}]: ${msg.content}`).join('\n');
      await interaction.editReply(`✅ **Sample Test Successful!**\n\n**Sample Messages:**\n${sampleText}\n\n**Generated Summary:**\n${summary}`);
      
    } catch (error) {
      console.error("❌ Sample test error:", error);
      await interaction.editReply(`❌ **Sample Test Failed**\n\nError: ${error.message}\n\nThis suggests the issue is with the AI API, not message fetching.`);
    }
  },
}; 