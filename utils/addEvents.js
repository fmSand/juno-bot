import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadEventsFromDir(client, dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await loadEventsFromDir(client, fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      const mod = await import(pathToFileURL(fullPath).href);
      const event = mod.default ?? mod;

      if (!event?.name || typeof event.execute !== "function") {
        console.warn(`⚠️ Skipped ${fullPath} (missing name/execute)`);
        continue;
      }

      const handler = (...args) => event.execute(...args, client);
      if (event.once) {
        client.once(event.name, handler);
      } else {
        client.on(event.name, handler);
      }

      console.log(`✅ ${event.name} (${fullPath}) Successfully Added`);
    }
  }
}

export default async function addEvents(client) {
  const eventsRoot = path.join(__dirname, "../events");
  await loadEventsFromDir(client, eventsRoot);
}
