const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("plan-meeting")
    .setDescription("Create a meeting as a Discord event")
    .addStringOption((opt) =>
      opt.setName("title").setDescription("Meeting title").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("date").setDescription("Date (YYYY-MM-DD)").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("time")
        .setDescription("Start time (HH:mm, 24-hour)")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("description").setDescription("Optional description")
    ),

  async execute(interaction) {
    const guild = interaction.guild;
    const title = interaction.options.getString("title");
    const date = interaction.options.getString("date");
    const time = interaction.options.getString("time");
    const description = interaction.options.getString("description") || "";

    // Convert date + time into a start timestamp
    const startTime = new Date(`${date}T${time}:00Z`);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour meeting

    try {
      const event = await guild.scheduledEvents.create({
        name: title,
        scheduledStartTime: startTime,
        scheduledEndTime: endTime,
        privacyLevel: 2, // GUILD_ONLY
        entityType: 3, // EXTERNAL
        description: description,
        entityMetadata: {
          location: "Voice Channel or Link", // Can be replaced with your custom logic
        },
      });

      await interaction.reply(
        `📅 Meeting created: **${title}** on ${date} at ${time}`
      );
    } catch (err) {
      console.error(err);
      await interaction.reply({
        content: " Failed to create event. Do I have permissions?",
        ephemeral: true,
      });
    }
  },
};
