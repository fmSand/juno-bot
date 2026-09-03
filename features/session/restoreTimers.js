import { startTimer } from "./timerManager.js";
import services from "../../services/index.js";
import { time, TimestampStyles } from "discord.js";
import { formatDurationMs } from "../../utils/formatTime.js";
import { DEFAULT_SESSION_MINUTES, WARN_BEFORE_MINUTES } from "./constants.js";

export async function restoreTimersOnStartup(client) {
  console.log("[Timer] Restoring timers for active sessions...");

  try {
    const { sessionService } = services;
    const activeSessions = await sessionService.getAllActive();

    if (!activeSessions || activeSessions.length === 0) {
      console.log("[Timer] No active sessions to restore");
      return;
    }

    console.log(`[Timer] Found ${activeSessions.length} active session(s)`);

    const now = Date.now();
    const warnBeforeMs = WARN_BEFORE_MINUTES * 60000;

    let restored = 0;
    let autoEnded = 0;

    for (const session of activeSessions) {
      const sessionId = session.id;
      const userId = session.userId;
      const startTimestamp = new Date(session.startedAt).getTime();

      const durationMinutes =
        typeof session.targetDurationMinutes === "number" && session.targetDurationMinutes > 0
          ? session.targetDurationMinutes
          : DEFAULT_SESSION_MINUTES;

      const expectedEndTime = startTimestamp + durationMinutes * 60000;
      const warnTime = expectedEndTime - warnBeforeMs;

      if (now < warnTime) {
        console.log(`[Timer] Restored timer for session ${sessionId} (${durationMinutes}m)`);
        startTimer(client, session, durationMinutes);
        restored++;
        continue;
      }

      const pastScheduledEnd = now > expectedEndTime;
      const actualEndTime = pastScheduledEnd ? expectedEndTime : now;

      const result = await sessionService.end(userId, {
        autoEnded: true,
        endedAt: new Date(actualEndTime),
      });

      if (result) {
        console.log(`[Timer] Auto-ended session ${sessionId} (restart after warning)`);
        await sendRestartNotice(client, session, result);
        autoEnded++;
      }
    }

    console.log(
      `[Timer] Restore complete: ${restored} restored, ${autoEnded} auto-ended due to restart`,
    );
  } catch (error) {
    console.error("[Timer] Error restoring timers:", error);
  }
}

async function sendRestartNotice(client, session, result) {
  const discordUserId = session.user.discordId;
  const { session: endedSession, durationMs } = result;

  const ended = time(endedSession.endedAt, TimestampStyles.ShortTime);
  const duration = formatDurationMs(durationMs);

  const messageContent =
    `⏰ **Session ended due to a bot restart**\n\n` +
    `You worked for **${duration}**.\n` +
    `Ended: ${ended}`;

  try {
    const user = await client.users.fetch(discordUserId);
    await user.send({
      content: messageContent,
    });
    console.log(`[Timer] Restart notice sent to user ${discordUserId}`);
  } catch (dmError) {
    console.error(`[Timer] Failed to send restart notice:`, dmError?.message ?? dmError);
  }
}
