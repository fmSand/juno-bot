export function minutesFromMs(ms, mode = "round") {
  const v = ms / 60000;
  if (mode === "floor") return Math.floor(v);
  if (mode === "ceil") return Math.ceil(v);
  return Math.round(v);
}

export function formatMinutesHm(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatDurationMs(ms, opts = {}) {
  return formatMinutesHm(minutesFromMs(ms, opts.mode ?? "round"));
}
