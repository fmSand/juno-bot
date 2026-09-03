import services from "../services/index.js";
import { handleCheckResult } from "../features/health/alertManager.js";
import { POLL_SCHEDULE } from "../features/health/constants.js";

export default {
  schedule: POLL_SCHEDULE,

  async task(client) {
    try {
      const result = await services.healthService.check(client);
      await handleCheckResult(client, result);
    } catch (err) {
      console.error("[healthPoll] Unexpected error:", err?.message ?? err);
    }
  },
};
