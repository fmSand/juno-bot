import {
  SlashCommandBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SeparatorSpacingSize,
  ContainerBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("health")
    .setDescription("Check if the bot and database are healthy")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  skipContext: true,

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const { healthService } = interaction.services;

    try {
      const result = await healthService.check(interaction.client);
      await interaction.editReply(formatResult(result));
    } catch (err) {
      console.error("[/health] Unexpected error:", err);
      await interaction.editReply(`🔴 Health check itself threw an error: ${err?.message ?? err}`);
    }
  },
};

function formatResult(result) {
  const { discord, database } = result;

  const discordText = discord.ok
    ? `🟢 Discord - Ready${discord.pingMs != null ? ` (${discord.pingMs}ms)` : ""}`
    : `🔴 Discord - ${discord.reason}`;

  const databaseText = database.ok
    ? `🟢 Database - Connected (${database.latencyMs}ms)`
    : `🔴 Database - ${database.reason}`;

  const container = new ContainerBuilder().setAccentColor(result.ok ? 0x57f287 : 0xed4245);

  container.addTextDisplayComponents((t) =>
    t.setContent(`## Bot Health - ${result.ok ? "🟢 Healthy" : "🔴 Degraded"}`),
  );

  container.addSeparatorComponents((s) =>
    s.setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  container.addTextDisplayComponents((t) => t.setContent([discordText, databaseText].join("\n")));

  container.addSeparatorComponents((s) =>
    s.setSpacing(SeparatorSpacingSize.Small).setDivider(false),
  );

  container.addTextDisplayComponents((t) =>
    t.setContent(`-# Uptime: ${formatUptime(process.uptime())}`),
  );

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  };
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds / 3600) % 24);
  const m = Math.floor((seconds / 60) % 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (d || h) parts.push(`${h}h`);
  if (d || h || m) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}
