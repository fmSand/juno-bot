import { getEnvInt } from "../../utils/envHelpers.js";

export const DEFAULT_SESSION_MINUTES = getEnvInt("DEFAULT_SESSION_MINUTES", 120);
export const MAX_SESSION_MINUTES = getEnvInt("MAX_SESSION_MINUTES", 480);
export const WARN_BEFORE_MINUTES = getEnvInt("WARN_BEFORE_MINUTES", 5);
export const GRACE_PERIOD_MINUTES = getEnvInt("GRACE_PERIOD_MINUTES", 3);
export const MIN_SESSION_MINUTES = getEnvInt("MIN_SESSION_MINUTES", 10);
