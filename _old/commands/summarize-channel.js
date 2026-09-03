const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { summarizeMessages } = require("../utils/aiSummary");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("summarize-channel")
    .setDescription("Summarize messages in a channel, handling large amounts of text by chunking.")
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to summarize')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    )
    .addIntegerOption(option =>
      option.setName('messages')
        .setDescription('Number of messages to process (max 200)')
        .setRequired(false)
        .setMinValue(10)
        .setMaxValue(200)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const channel = interaction.options.getChannel('channel');
    const messageCount = interaction.options.getInteger('messages') || 100;

    let allMessages = [];

    try {
      const fetched = await channel.messages.fetch({ limit: messageCount });
      allMessages = [...fetched.values()]
        .filter(msg => !msg.author.bot)
        .sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    } catch (error) {
      return interaction.editReply(`❌ **Error:** Could not fetch messages from <#${channel.id}>.`);
    }

    if (allMessages.length === 0) {
      return interaction.editReply(`📭 No user messages found to summarize in <#${channel.id}>.`);
    }

    await interaction.editReply(`Found ${allMessages.length} messages. Summarizing... This may take a moment.`);

    try {
      const summary = await summarizeMessages(allMessages, interaction);

      const stats = `📊 **Channel Summary: #${channel.name}**\n• Messages processed: ${allMessages.length}`;
      await interaction.editReply({ content: `${stats}\n\n🧠 **AI Summary**\n${summary}`, ephemeral: false });

    } catch (error) {
      console.error(error);
      await interaction.editReply(`❌ An error occurred during summarization: ${error.message}`);
    }
  }
}; 