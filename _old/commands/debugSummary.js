const { SlashCommandBuilder } = require("discord.js");
const config = require("../config.json");
const { parseMessage } = require("../utils/aiSummary");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("debug-summary")
    .setDescription("Debug the summary system to see what's happening")
    .addStringOption(option =>
      option.setName('days')
        .setDescription('How many days back to look')
        .setRequired(false)
        .addChoices(
          { name: '3 Days', value: '3' },
          { name: '7 Days', value: '7' },
          { name: '14 Days', value: '14' }
        )),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const daysBack = parseInt(interaction.options.getString('days') || '3');
    const client = interaction.client;
    const sourceChannelIds = config.sourceChannelIds;
    const timeAgo = Date.now() - (daysBack * 24 * 60 * 60 * 1000);

    let debugReport = `🔍 **Summary Debug Report (Last ${daysBack} Days)**\n`;
    let totalMessagesWithContent = 0;
    let totalMessagesInspected = 0;

    for (const channelId of sourceChannelIds) {
      const channel = client.channels.cache.get(channelId);
      
      if (!channel) {
        debugReport += `\n❌ **Channel ${channelId}**: Not found`;
        continue;
      }

      try {
        const permissions = channel.permissionsFor(client.user);
        if (!permissions.has('ViewChannel') || !permissions.has('ReadMessageHistory')) {
          debugReport += `\n❌ **#${channel.name}**: Missing permissions`;
          continue;
        }

        const fetched = await channel.messages.fetch({ limit: 100 });
        const recentMessages = [...fetched.values()].filter(msg => msg.createdTimestamp > timeAgo);
        totalMessagesInspected += recentMessages.length;

        if (recentMessages.length > 0) {
          const withContent = recentMessages.filter(msg => parseMessage(msg).length > 5);
          totalMessagesWithContent += withContent.length;
          debugReport += `\n✅ **#${channel.name}**: Found ${withContent.length} messages with text content (out of ${recentMessages.length} recent).`;
        }

      } catch (error) {
        debugReport += `\n❌ **#${channel.name}**: Error - ${error.message}`;
      }
    }
    
    debugReport += `\n\n**Total Found:** ${totalMessagesWithContent} messages with text across ${sourceChannelIds.length} channels.`;

    await interaction.editReply(debugReport);
  },
}; 