const { SlashCommandBuilder, ChannelType } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("show-raw-messages")
    .setDescription("Shows the raw text content of the last 15 messages in a channel.")
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to inspect')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.options.getChannel('channel');
    let report = `🔬 **Raw Message Data for #${channel.name}**\n\n`;

    try {
      const messages = await channel.messages.fetch({ limit: 15 });
      
      if (messages.size === 0) {
        report += "Could not find any messages in this channel.";
        return interaction.editReply(report);
      }

      messages.forEach(msg => {
        const author = msg.author.tag;
        const content = msg.content ? `"${msg.content}"` : "[EMPTY CONTENT]";
        const embedsCount = msg.embeds.length;
        const attachmentsCount = msg.attachments.size;
        
        const messageLine = `**[${author}]**: ${content} (Embeds: ${embedsCount}, Attachments: ${attachmentsCount})\n`;
        
        if ((report.length + messageLine.length) < 1900) {
            report += messageLine;
        }
      });
      
      await interaction.editReply(report);

    } catch (error) {
      console.error(error);
      await interaction.editReply(`❌ An error occurred: ${error.message}`);
    }
  },
}; 