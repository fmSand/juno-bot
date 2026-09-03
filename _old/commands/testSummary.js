const { SlashCommandBuilder } = require("discord.js");
const { summarizeMessages, parseMessage } = require("../utils/aiSummary");
const config = require("../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("test-summary")
    .setDescription("Test summary with relaxed filters")
    .addStringOption(option =>
      option.setName('days')
        .setDescription('How many days back to look')
        .setRequired(false)
        .addChoices(
          { name: 'Last 3 days', value: '3' },
          { name: 'Last 7 days', value: '7' },
          { name: 'Last 14 days', value: '14' }
        )),

  async execute(interaction) {
    await interaction.deferReply();

    const daysBack = parseInt(interaction.options.getString('days') || '7');
    const client = interaction.client;
    const sourceChannelIds = config.sourceChannelIds;
    const timeAgo = Date.now() - (daysBack * 24 * 60 * 60 * 1000);

    let allMessages = [];
    let totalMessagesFetched = 0;

    // Use more relaxed filters for testing
    for (const id of sourceChannelIds) {
      const channel = client.channels.cache.get(id);
      if (!channel) {
        console.log(`Channel ${id} not found`);
        continue;
      }

      try {
        const fetched = await channel.messages.fetch({ limit: 100 });
        totalMessagesFetched += fetched.size;
        
        // More relaxed filtering - include embeds and attachments
        const messages = [...fetched.values()].filter(
          (msg) =>
            !msg.author.bot && // Only exclude bot messages
            msg.createdTimestamp > timeAgo && // Time filter
            (msg.content.length > 0 || msg.embeds.length > 0 || msg.attachments.size > 0) // Has some content
        );

        allMessages = allMessages.concat(messages);
        console.log(`Channel ${channel.name}: ${messages.length} messages in last ${daysBack} days`);
      } catch (error) {
        console.error(`Error fetching messages from channel ${id}:`, error);
      }
    }

    if (allMessages.length === 0) {
      return interaction.editReply(`📭 **Test Summary - No Messages Found**\n\nEven with relaxed filters, no messages were found in the last ${daysBack} days.\n\n**Possible issues:**\n• Channels might be empty\n• Messages might be older than ${daysBack} days\n• Bot might not have proper permissions\n• Channel IDs might be incorrect\n\nTry running \`/debug-summary\` for detailed diagnostics.`);
    }

    // Sort and take recent messages
    const recentMessages = allMessages
      .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
      .slice(-30); // Take 30 most recent messages

    // Check if messages have content after parsing
    const messagesWithContent = recentMessages.filter(msg => {
      const parsed = parseMessage(msg);
      return parsed.length > 10;
    });

    if (messagesWithContent.length === 0) {
      return interaction.editReply(`📭 **Test Summary - No Content Found**\n\nFound ${recentMessages.length} messages but they contain no substantial text content.\n\nThis might be because:\n• Messages are mostly images/attachments\n• Messages are mostly embeds without text\n• Messages are very short\n\nTry running \`/debug-summary\` to see message types.`);
    }

    const summary = await summarizeMessages(messagesWithContent, interaction);

    const stats = `📊 **Test Summary Stats:**\n• Messages found: ${messagesWithContent.length}/${totalMessagesFetched}\n• Channels: ${sourceChannelIds.length}\n• Timeframe: Last ${daysBack} days\n• Filters: Relaxed (includes embeds/attachments)`;

    await interaction.editReply(`${stats}\n\n🧠 **Test Summary**\n${summary}`);
  },
}; 