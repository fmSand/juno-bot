import {
  ButtonStyle,
  ContainerBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  time,
  TimestampStyles,
} from "discord.js";
import { DateTime } from "luxon";
import { formatDurationMs } from "../../utils/formatTime.js";

const TIMEZONE = "Europe/Oslo";

export function buildLiveDashboardUI({ activeSessions = [], workedToday = [] } = {}) {
  const now = new Date();

  const container = new ContainerBuilder().setAccentColor(
    activeSessions.length > 0 ? 0x57f287 : 0x1c1c84,
  );

  //HEADER
  container.addSectionComponents((section) =>
    section
      .addTextDisplayComponents((text) => text.setContent(buildHeaderText(now)))
      .setButtonAccessory((btn) =>
        btn
          .setCustomId("dashboard:clock_toggle")
          .setLabel("⏱ Clock In / Out")
          .setStyle(ButtonStyle.Primary),
      ),
  );
  container.addSeparatorComponents((sep) =>
    sep.setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  //CURRENTLY WORKING
  const workingHeading =
    activeSessions.length > 0
      ? `### Currently Working (${activeSessions.length})`
      : `### Currently Working`;

  container.addTextDisplayComponents((text) => text.setContent(workingHeading));

  if (activeSessions.length === 0) {
    container.addTextDisplayComponents((text) => text.setContent("-# No one is clocked in."));
  } else {
    const lines = activeSessions.map((session) => buildActiveSessionText(session, now));
    container.addTextDisplayComponents((text) => text.setContent(lines.join("\n")));
  }

  container.addSeparatorComponents((sep) =>
    sep.setSpacing(SeparatorSpacingSize.Small).setDivider(false),
  );
  container.addSeparatorComponents((sep) =>
    sep.setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  //WORKED TODAY
  const totalWorkedMs = workedToday.reduce((sum, w) => sum + w.totalMs, 0);
  const totalFormatted =
    totalWorkedMs > 0 ? ` (${formatDurationMs(totalWorkedMs, { mode: "floor" })})` : "";

  container.addTextDisplayComponents((text) =>
    text.setContent(`### Worked Today${totalFormatted}`),
  );

  if (workedToday.length === 0) {
    container.addTextDisplayComponents((text) =>
      text.setContent("-# No completed sessions yet today"),
    );
  } else {
    const topMinutes = Math.floor(workedToday[0].totalMs / 60000);
    const topTied = workedToday.filter((w) => Math.floor(w.totalMs / 60000) === topMinutes);
    const remainder = workedToday.slice(topTied.length);

    const crownMentions = topTied.map((w) => `<@${w.user.discordId}>`).join(", ");
    const crownDuration = formatDurationMs(workedToday[0].totalMs, { mode: "floor" });

    const lines = [`♕ ${crownMentions}  —  ${crownDuration}`];

    for (let i = 0; i < remainder.length && lines.length < 10; i++) {
      const w = remainder[i];
      lines.push(
        `${i + 2}. <@${w.user.discordId}>  —  ${formatDurationMs(w.totalMs, { mode: "floor" })}`,
      );
    }
    container.addTextDisplayComponents((text) => text.setContent(lines.join("\n")));
  }

  //FOOTER
  container.addSeparatorComponents((sep) =>
    sep.setSpacing(SeparatorSpacingSize.Small).setDivider(false),
  );
  container.addSeparatorComponents((sep) =>
    sep.setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );
  container.addTextDisplayComponents((text) =>
    text.setContent(`-# Last updated ${time(now, TimestampStyles.RelativeTime)}`),
  );

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
  };
}

//HELPERS
function buildHeaderText(now) {
  const osloNow = DateTime.fromJSDate(now).setZone(TIMEZONE);
  const week = osloNow.weekNumber;
  return `## JUNO DASHBOARD\n` + `${time(now, TimestampStyles.LongDate)} • Week ${week}`;
}

function buildActiveSessionText(session, now) {
  const discordId = session.user?.discordId;
  const mention = discordId ? `<@${discordId}>` : session.user?.name || "Unknown";
  const durationMs = now - new Date(session.startedAt);
  const duration = formatDurationMs(durationMs, { mode: "floor" });
  let text = `• ${mention} — ${duration}`;
  if (session.activity) {
    text += `\n-# ${session.activity}`;
  }
  return text;
}
