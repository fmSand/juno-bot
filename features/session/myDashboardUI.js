import {
  MessageFlags,
  ContainerBuilder,
  SeparatorSpacingSize,
  StringSelectMenuOptionBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  TextDisplayBuilder,
} from "discord.js";
import { DateTime } from "luxon";
import { formatDurationMs } from "../../utils/formatTime.js";

const TIMEZONE = "Europe/Oslo";
const MONTH_HISTORY = 6;

export function buildMonthSelect(selectedValue) {
  const now = DateTime.now().setZone(TIMEZONE);

  const options = Array.from({ length: MONTH_HISTORY }, (_, i) => {
    const dt = now.minus({ months: i });
    const value = dt.toFormat("yyyy-MM");
    return new StringSelectMenuOptionBuilder()
      .setLabel(dt.toFormat("LLLL yyyy"))
      .setValue(value)
      .setDefault(value === selectedValue);
  });

  const select = new StringSelectMenuBuilder()
    .setCustomId("my_dashboard:month")
    .setPlaceholder("Select a month")
    .addOptions(options);

  return new ActionRowBuilder().addComponents(select);
}

export function buildMyDashboardUI(user, stats) {
  const now = DateTime.now().setZone(TIMEZONE);
  const currentMonthValue = now.toFormat("yyyy-MM");

  const anchor = DateTime.fromFormat(stats.monthLabel, "LLLL yyyy", { locale: "en" }).setZone(
    TIMEZONE,
  );
  const selectedValue = anchor.isValid ? anchor.toFormat("yyyy-MM") : currentMonthValue;
  const shortMonth = anchor.isValid ? anchor.toFormat("MMM yyyy") : stats.monthLabel;
  const container = new ContainerBuilder().setAccentColor(0x5865f2);

  container.addTextDisplayComponents((text) =>
    text.setContent(`## 👤 ${user.name} • ${shortMonth}\n-# This month's work sessions`),
  );
  container.addSeparatorComponents((sep) =>
    sep.setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  if (stats.sessionCount === 0) {
    container.addTextDisplayComponents((text) =>
      text.setContent("-# No completed sessions this month yet."),
    );
  } else {
    const totalFormatted = formatDurationMs(stats.totalMs, { mode: "floor" });
    container.addTextDisplayComponents((text) =>
      text.setContent(
        `**${totalFormatted}** across **${stats.sessionCount}** session${stats.sessionCount === 1 ? "" : "s"}`,
      ),
    );

    container.addSeparatorComponents((sep) =>
      sep.setSpacing(SeparatorSpacingSize.Small).setDivider(false),
    );
    container.addTextDisplayComponents((text) =>
      text.setContent(
        [
          `Avg · ${formatDurationMs(stats.avgMs, { mode: "round" })}`,
          `▲ Longest · ${formatDurationMs(stats.longestMs, { mode: "round" })}`,
          `▼ Shortest · ${formatDurationMs(stats.shortestMs, { mode: "round" })}`,
        ].join("\n"),
      ),
    );
    container.addSeparatorComponents((sep) =>
      sep.setSpacing(SeparatorSpacingSize.Small).setDivider(false),
    );

    const consistencyLines = [`Active days · ${stats.activeDays} / ${stats.daysElapsed}`];

    if (stats.bestDay) {
      const bestDayFormatted = DateTime.fromISO(stats.bestDay.day, { zone: TIMEZONE }).toFormat(
        "MMM d",
      );
      consistencyLines.push(
        `★ Best day · ${bestDayFormatted}  (${formatDurationMs(stats.bestDay.totalMs, { mode: "floor" })})`,
      );
    }

    if (stats.streak > 0) {
      const suffix = stats.streakActive ? " (active)" : "";
      consistencyLines.push(
        `◆ Streak · ${stats.streak} day${stats.streak === 1 ? "" : "s"}${suffix}`,
      );
    }
    container.addTextDisplayComponents((text) => text.setContent(consistencyLines.join("\n")));
  }

  return {
    components: [container, buildMonthSelect(selectedValue)],
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
  };
}

export function buildErrorUI() {
  const container = new ContainerBuilder()
    .setAccentColor(0xe74c3c)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("Something went wrong loading your stats."),
    );
  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  };
}
