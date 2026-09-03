import { getEnvInt, parseIds } from "../../utils/envHelpers.js";

export const FAILURE_THRESHOLD = getEnvInt("HEALTH_FAILURE_THRESHOLD", 3);
export const BOT_ISSUES_CHANNEL_ID = process.env.BOT_ISSUES_CHANNEL_ID || null;
export const ADMIN_USER_IDS = parseIds(process.env.ADMIN_USER_IDS ?? "");
export const POLL_SCHEDULE = process.env.HEALTH_POLL_SCHEDULE || "*/5 * * * *";
