const { SlashCommandBuilder } = require("discord.js");
const { summarizeMessages } = require("../utils/aiSummary");
const config = require("../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("summarize-now")
    .setDescription("Generate an AI summary of recent chats")
    .addStringOption(option =>
      option.setName('timeframe')
        .setDescription('How far back to summarize')
        .setRequired(false)
        .addChoices(
          { name: 'Last 24 hours', value: '24h' },
          { name: 'Last 3 days', value: '3d' }
        )),

  async execute(interaction) {
    await interaction.deferReply();

    const timeframe = interaction.options.getString('timeframe') || '24h';
    const client = interaction.client;
    const sourceChannelIds = config.sourceChannelIds;
    
    // Calculate time range based on selection
    const timeRanges = {
      '24h': 24 * 60 * 60 * 1000,
      '3d': 3 * 24 * 60 * 60 * 1000
    };
    
    const timeAgo = Date.now() - timeRanges[timeframe];
    
    // Adjust message limits based on timeframe
    const messageLimits = {
      '24h': 50,    // 50 messages per channel for 24h
      '3d': 75      // 75 messages per channel for 3 days
    };
    
    const messageLimit = messageLimits[timeframe];

    let allMessages = [];
    let totalMessagesFetched = 0;

    for (const id of sourceChannelIds) {
      const channel = client.channels.cache.get(id);
      if (!channel) continue;

      try {
        const fetched = await channel.messages.fetch({ limit: messageLimit });
        totalMessagesFetched += fetched.size;
        
        const messages = [...fetched.values()].filter(
          (msg) =>
            !msg.author.bot && // Exclude bot messages
            msg.createdTimestamp > timeAgo &&
            msg.content.length > 10 && // Only messages with substantial content
            !msg.content.startsWith('!') && // Exclude command messages
            !msg.content.startsWith('/') && // Exclude slash commands
            !msg.content.match(/^[^\w]*$/) // Exclude messages with only symbols/emojis
        );

        allMessages = allMessages.concat(messages);
      } catch (error) {
        console.error(`Error fetching messages from channel ${id}:`, error);
      }
    }

    if (allMessages.length === 0) {
      return interaction.editReply(`📭 No messages found in the last ${timeframe}. Try a longer timeframe or check if there's been recent activity.`);
    }

    // Sort by timestamp and take only the most recent messages
    const recentMessages = allMessages
      .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
      .slice(-100); // Limit to 100 most recent messages

    // Add context about the summary
    const timeframeText = {
      '24h': 'last 24 hours',
      '3d': 'last 3 days'
    };

    const summary = await summarizeMessages(recentMessages, interaction);

    const stats = `📊 **Summary Stats:**\n• Timeframe: ${timeframeText[timeframe]}\n• Messages processed: ${recentMessages.length}/${totalMessagesFetched}\n• Channels: ${sourceChannelIds.length}`;

    await interaction.editReply(`${stats}\n\n🧠 **AI Summary**\n${summary}`);
  },
};
