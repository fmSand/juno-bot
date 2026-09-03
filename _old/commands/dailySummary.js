const { SlashCommandBuilder } = require("discord.js");
const { summarizeMessages } = require("../utils/aiSummary");
const config = require("../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily-summary")
    .setDescription("Generate a quick daily summary (most efficient)")
    .addStringOption(option =>
      option.setName('action')
        .setDescription('What to do with the daily summary')
        .setRequired(false)
        .addChoices(
          { name: 'Generate now', value: 'generate' },
          { name: 'Show scheduler status', value: 'status' },
          { name: 'Test scheduler', value: 'test' }
        )),

  async execute(interaction) {
    const action = interaction.options.getString('action') || 'generate';

    if (action === 'status') {
      const scheduler = interaction.client.dailyScheduler;
      if (!scheduler) {
        return interaction.reply({
          content: "❌ Daily scheduler is not running.",
          ephemeral: true
        });
      }

      const status = scheduler.isRunning ? "🟢 Running" : "🔴 Stopped";
      return interaction.reply({
        content: `📊 **Daily Scheduler Status:**\n• Status: ${status}\n• Next summary: 9:00 AM daily\n• Summary channel: <#${config.chatSummaryChannelId}>`,
        ephemeral: true
      });
    }

    if (action === 'test') {
      await interaction.deferReply();
      
      try {
        const scheduler = interaction.client.dailyScheduler;
        if (!scheduler) {
          return interaction.editReply("❌ Daily scheduler is not running.");
        }

        await scheduler.postDailySummary();
        await interaction.editReply("✅ Test daily summary posted to the summary channel!");
      } catch (error) {
        console.error("Test summary error:", error);
        await interaction.editReply("❌ Error posting test summary.");
      }
      return;
    }

    // Default action: generate summary
    await interaction.deferReply();

    const client = interaction.client;
    const sourceChannelIds = config.sourceChannelIds;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    let allMessages = [];
    let totalMessagesFetched = 0;

    // For daily summary, we'll be more aggressive with filtering
    for (const id of sourceChannelIds) {
      const channel = client.channels.cache.get(id);
      if (!channel) continue;

      try {
        // Only fetch 30 messages per channel for daily summary
        const fetched = await channel.messages.fetch({ limit: 30 });
        totalMessagesFetched += fetched.size;
        
        const messages = [...fetched.values()].filter(
          (msg) =>
            !msg.author.bot && // Exclude bot messages
            msg.createdTimestamp > oneDayAgo &&
            msg.content.length > 15 && // Only substantial messages
            !msg.content.startsWith('!') && // Exclude commands
            !msg.content.startsWith('/') && // Exclude slash commands
            !msg.content.match(/^[^\w]*$/) && // Exclude symbol-only messages
            !msg.content.toLowerCase().includes('good morning') && // Exclude greetings
            !msg.content.toLowerCase().includes('good night') &&
            !msg.content.toLowerCase().includes('bye') &&
            msg.content.length < 500 // Exclude very long messages
        );

        allMessages = allMessages.concat(messages);
      } catch (error) {
        console.error(`Error fetching messages from channel ${id}:`, error);
      }
    }

    if (allMessages.length === 0) {
      return interaction.editReply(`📭 No substantial messages found in the last 24 hours. The team might be quiet today!`);
    }

    // Take only the 50 most recent substantial messages
    const recentMessages = allMessages
      .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
      .slice(-50);

    const summary = await summarizeMessages(recentMessages, interaction);

    const stats = `📊 **Daily Summary Stats:**\n• Messages processed: ${recentMessages.length}/${totalMessagesFetched}\n• Channels: ${sourceChannelIds.length}\n• Timeframe: Last 24 hours`;

    await interaction.editReply(`${stats}\n\n🧠 **Daily Summary**\n${summary}`);
  },
}; 