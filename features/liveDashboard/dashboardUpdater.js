import { buildLiveDashboardUI } from "./dashboardUI.js";
import services from "../../services/index.js";

const MIN_UPDATE_INTERVAL_MS = 15_000;
let lastEditAt = 0;
let updateInFlight = false;
let trailingTimeout = null;
let pending = false;

//throttled with trailing edge
export function requestDashboardUpdate(client) {
  pending = true;
  scheduleIfNeeded(client);
}

//Force immediate update, bypassing throttle (Used for startup and admin command).
export async function forceUpdate(client) {
  if (trailingTimeout) {
    clearTimeout(trailingTimeout);
    trailingTimeout = null;
  }
  pending = false;
  await performUpdate(client);
}

function scheduleIfNeeded(client) {
  if (trailingTimeout) return;
  if (updateInFlight) return;
  const now = Date.now();
  const elapsed = now - lastEditAt;

  if (elapsed >= MIN_UPDATE_INTERVAL_MS) {
    pending = false;
    runUpdate(client);
  } else {
    const delay = MIN_UPDATE_INTERVAL_MS - elapsed;

    trailingTimeout = setTimeout(() => {
      trailingTimeout = null;

      if (pending) {
        pending = false;
        runUpdate(client);
      }
    }, delay);
  }
}

//When the update completes, re-checks if more events arrived and schedules next one.
function runUpdate(client) {
  updateInFlight = true;
  performUpdate(client)
    .catch((err) => {
      console.error("[LiveDashboard] Update failed:", err.message);
    })
    .finally(() => {
      updateInFlight = false;

      if (pending) {
        scheduleIfNeeded(client);
      }
    });
}

//Perform the actual dashboard update. Only sets lastEditAt if messages were edited.
async function performUpdate(client) {
  const { sessionService, dashboardService } = services;
  const dashboards = await dashboardService.getAll();
  if (!dashboards?.length) return;

  const [activeSessions, workedToday] = await Promise.all([
    sessionService.getAllActive(),
    sessionService.getWorkedToday(),
  ]);
  const payload = buildLiveDashboardUI({ activeSessions, workedToday });
  const results = await Promise.allSettled(
    dashboards.map((dashboard) =>
      updateSingleDashboard(client, dashboard, payload, dashboardService),
    ),
  );

  const failed = results.filter((r) => r.status === "rejected").length;
  const edited = dashboards.length - failed;
  if (edited > 0) {
    lastEditAt = Date.now();
  }
}

//Update a dashboard. Handles cleanup if message/channel no longer exists.
async function updateSingleDashboard(client, dashboard, payload, dashboardService) {
  try {
    const channel = await client.channels.fetch(dashboard.channelId);
    if (!channel) {
      console.warn(`[LiveDashboard] Channel ${dashboard.channelId} not found, removing config`);
      await dashboardService.remove(dashboard.channelId);
      return;
    }

    const message = await channel.messages.fetch(dashboard.messageId);
    await message.edit(payload);
  } catch (err) {
    if (err.code === 10008 || err.code === 10003) {
      console.warn(
        `[LiveDashboard] Message/channel deleted (${err.code}), removing config for ${dashboard.channelId}`,
      );
      await dashboardService.remove(dashboard.channelId);
    } else {
      console.error(
        `[LiveDashboard] Failed to update dashboard in ${dashboard.channelId}:`,
        err.message,
      );
    }
  }
}
