export function required(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required env: ${name}`);
    // console.error(`Missing required env: ${name}`);
    // process.exit(1);
  }
  return v;
}

// Accept JSON array or comma-separated
export function parseIds(value) {
  try {
    const arr = JSON.parse(value);
    if (Array.isArray(arr)) return arr.map(String);
  } catch {
    /* fall back */
  }
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const getEnvInt = (name, defaultValue) => {
  const value = parseInt(process.env[name] ?? "", 10);
  return Number.isNaN(value) ? defaultValue : value;
};
