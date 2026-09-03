import { forceUpdate, requestDashboardUpdate } from "./dashboardUpdater.js";
import { getEnvInt } from "../../utils/envHelpers.js";
import services from "../../services/index.js";

const IDLE_REFRESH_MINUTES = getEnvInt("DASHBOARD_IDLE_REFRESH_MINUTES", 5);
let refreshInterval = null;

export async function initializeLiveDashboard(client) {
  const { dashboardService } = services;

  try {
    const dashboards = await dashboardService.getAll();
    if (!dashboards?.length) {
      console.log("[LiveDashboard] No dashboards configured, skipping initialization");
      return;
    }
    console.log(`[LiveDashboard] Initializing ${dashboards.length} dashboard(s)...`);
    await forceUpdate(client);
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    //Idle ticks go through the throttled path so they don't conflict with user-triggered updates.
    refreshInterval = setInterval(
      () => requestDashboardUpdate(client),
      IDLE_REFRESH_MINUTES * 60 * 1000,
    );
    console.log(`[LiveDashboard] Ready — refreshing every ${IDLE_REFRESH_MINUTES} minute(s)`);
  } catch (err) {
    console.error("[LiveDashboard] Initialization failed:", err.message);
  }
}

export function shutdownLiveDashboard() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
    console.log("[LiveDashboard] Shutdown complete");
  }
}
