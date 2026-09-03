import { ActionRowBuilder, ButtonBuilder, ButtonStyle, time, TimestampStyles } from "discord.js";
import services from "../../services/index.js";
import { minutesFromMs, formatDurationMs } from "../../utils/formatTime.js";
import { requestDashboardUpdate } from "../liveDashboard/dashboardUpdater.js";
import {
  DEFAULT_SESSION_MINUTES,
  WARN_BEFORE_MINUTES,
  GRACE_PERIOD_MINUTES,
  MAX_SESSION_MINUTES,
} from "./constants.js";

const timerRegistry = new Map();

export function startTimer(client, session, durationMinutes = DEFAULT_SESSION_MINUTES) {
  const sessionId = session.id;

  const startTimestamp = new Date(session.startedAt).getTime();
  const endTimestamp = startTimestamp + durationMinutes * 60000;
  const warnTimestamp = endTimestamp - WARN_BEFORE_MINUTES * 60000;

  const now = Date.now();
  const warnDelayMilliseconds = warnTimestamp - now;
  const endDelayMilliseconds = endTimestamp - now;

  let warnTimeout = null;
  let endTimeout = null;

  if (warnDelayMilliseconds > 0) {
    warnTimeout = setTimeout(async () => {
      await sendWarningDM(client, session, endTimestamp);
    }, warnDelayMilliseconds);

    const minutesUntilWarn = minutesFromMs(warnDelayMilliseconds, "round");
    console.log(
      `[Timer] startTimer: session=${sessionId} total=${durationMinutes}m, warn in ~${minutesUntilWarn}m`,
    );
  } else {
    console.log(
      `[Timer] startTimer: session=${sessionId} warning time already passed, skipping duplicate warning`,
    );
  }

  if (endDelayMilliseconds > 0) {
    endTimeout = setTimeout(() => {
      scheduleGracePeriodAt(client, session, endTimestamp);
    }, endDelayMilliseconds);

    timerRegistry.set(sessionId, {
      warnTimeout,
      endTimeout,
      graceTimeout: null,
      warningMessage: null,
    });
  } else {
    console.log(
      `[Timer] startTimer: session=${sessionId} end time already passed, scheduling grace period now`,
    );

    timerRegistry.set(sessionId, {
      warnTimeout,
      endTimeout: null,
      graceTimeout: null,
      warningMessage: null,
    });
    scheduleGracePeriodAt(client, session, endTimestamp);
  }
}

async function sendWarningDM(client, session, endTimestampMs) {
  const sessionId = session.id;

  try {
    const { sessionService } = services;
    const sessionWithUser = await sessionService.getById(sessionId, { includeUser: true });
    if (!sessionWithUser || !sessionWithUser.user) {
      console.error(`[Timer] sendWarningDM: session ${sessionId} not found or missing user`);
      return;
    }

    const discordUserId = sessionWithUser.user.discordId;
    const user = await client.users.fetch(discordUserId);

    const customIdExtend15 = `timer:extend:15:${sessionId}`;
    const customIdExtend30 = `timer:extend:30:${sessionId}`;
    const customIdExtend60 = `timer:extend:60:${sessionId}`;
    const customIdClockOut = `timer:clockout:${sessionId}`;

    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(customIdExtend15)
        .setLabel("Extend +15m")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(customIdExtend30)
        .setLabel("Extend +30m")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(customIdExtend60)
        .setLabel("Extend +60m")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(customIdClockOut)
        .setLabel("Clock Out")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("🛑"),
    );

    const endDate = new Date(endTimestampMs);
    const warningContent = {
      content:
        `⏰ **Your session is ending soon**\n\n` +
        `You'll be automatically clocked out after ${time(endDate, TimestampStyles.ShortTime)}\n` +
        `Want to keep working?`,
      components: [actionRow],
    };

    const registryEntry = timerRegistry.get(sessionId);
    const existingWarningMessage = registryEntry?.warningMessage;

    let warningMessage;

    if (existingWarningMessage) {
      try {
        warningMessage = await existingWarningMessage.edit(warningContent);
        console.log(`[Timer] Updated existing warning message for session ${sessionId}`);
      } catch (editErr) {
        console.warn(
          `[Timer] Failed to edit existing warning message, sending new one:`,
          editErr.message,
        );
        warningMessage = await user.send(warningContent);
        console.log(`[Timer] Sent new warning message for session ${sessionId}`);
      }
    } else {
      warningMessage = await user.send(warningContent);
      console.log(`[Timer] Sent warning message for session ${sessionId}`);
    }
    if (registryEntry) {
      registryEntry.warningMessage = warningMessage;
    }
  } catch (err) {
    console.error(`[Timer] sendWarningDM: failed for session ${sessionId}:`, err?.message ?? err);
  }
}

function scheduleGracePeriodAt(client, session, endTimestampMs) {
  const sessionId = session.id;
  const graceEndTimestamp = endTimestampMs + GRACE_PERIOD_MINUTES * 60000;
  const delayMs = Math.max(0, graceEndTimestamp - Date.now());

  const registryEntry = timerRegistry.get(sessionId);
  if (registryEntry?.warnTimeout) clearTimeout(registryEntry.warnTimeout);
  if (registryEntry?.endTimeout) clearTimeout(registryEntry.endTimeout);

  const graceTimeout = setTimeout(async () => {
    await autoEndSession(client, session.userId, sessionId);
  }, delayMs);

  if (registryEntry) {
    registryEntry.graceTimeout = graceTimeout;
  } else {
    timerRegistry.set(sessionId, {
      warnTimeout: null,
      endTimeout: null,
      graceTimeout,
      warningMessage: null,
    });
  }

  console.log(
    `[Timer] scheduleGracePeriodAt: session=${sessionId} grace=${GRACE_PERIOD_MINUTES}m after target`,
  );
}

async function autoEndSession(client, userId, sessionId) {
  const registryEntry = timerRegistry.get(sessionId);

  try {
    const { sessionService } = services;
    const result = await sessionService.end(userId, { autoEnded: true });

    if (result) {
      console.log(`[Timer] autoEndSession: session ${sessionId} auto-ended successfully`);

      if (registryEntry?.warningMessage) {
        try {
          const { session: endedSession, durationMs } = result;
          const duration = formatDurationMs(durationMs);
          const endedTime = time(endedSession.endedAt, TimestampStyles.ShortTime);

          await registryEntry.warningMessage.edit({
            content:
              `⏰ **You've been clocked out automatically**\n\n` +
              `You worked for ${duration}\n` +
              `Ended: ${endedTime}`,
            components: [],
          });
          console.log(`[Timer] autoEndSession: updated warning message for session ${sessionId}`);
        } catch (editErr) {
          console.error(`[Timer] autoEndSession: failed to edit warning message:`, editErr.message);
        }
      }
      requestDashboardUpdate(client);
    } else {
      console.log(`[Timer] autoEndSession: session ${sessionId} already ended`);
    }
  } catch (err) {
    console.error(
      `[Timer] autoEndSession: error ending session ${sessionId}:`,
      err?.message ?? err,
    );
  } finally {
    cancelTimer(sessionId);
  }
}

export function cancelTimer(sessionId) {
  const registryEntry = timerRegistry.get(sessionId);
  if (!registryEntry) {
    return;
  }

  const { warnTimeout, endTimeout, graceTimeout } = registryEntry;

  if (warnTimeout) clearTimeout(warnTimeout);
  if (endTimeout) clearTimeout(endTimeout);
  if (graceTimeout) clearTimeout(graceTimeout);

  timerRegistry.delete(sessionId);

  console.log(`[Timer] cancelTimer: cleared timeouts for session ${sessionId}`);
}

export async function extendTimer(client, sessionId, addMinutes) {
  try {
    const { sessionService } = services;
    const session = await sessionService.getById(sessionId, { includeUser: true });

    if (!session || session.endedAt) {
      console.error(`[Timer] extendTimer: session ${sessionId} not found or already ended`);
      return null;
    }

    const currentDurationMinutes =
      typeof session.targetDurationMinutes === "number" && session.targetDurationMinutes > 0
        ? session.targetDurationMinutes
        : DEFAULT_SESSION_MINUTES;

    const newDurationMinutes = Math.min(currentDurationMinutes + addMinutes, MAX_SESSION_MINUTES);

    const updated = await sessionService.setTargetDuration(session.userId, newDurationMinutes);
    if (!updated) {
      console.error(`[Timer] extendTimer: failed to persist new duration for session ${sessionId}`);
      return null;
    }

    const registryEntry = timerRegistry.get(sessionId);
    const existingWarningMessage = registryEntry?.warningMessage;

    cancelTimer(sessionId);
    startTimer(client, session, newDurationMinutes);

    const newRegistryEntry = timerRegistry.get(sessionId);
    if (newRegistryEntry && existingWarningMessage) {
      newRegistryEntry.warningMessage = existingWarningMessage;
    }

    console.log(
      `[Timer] extendTimer: session=${sessionId} extended to ${newDurationMinutes} minutes total`,
    );
    return updated;
  } catch (error) {
    console.error(
      `[Timer] extendTimer: error extending session ${sessionId}:`,
      error?.message ?? error,
    );
    return null;
  }
}
