import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadCommandsFromDir(client, dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await loadCommandsFromDir(client, fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      const mod = await import(pathToFileURL(fullPath).href);
      const command = mod.default ?? mod;
      if (!command?.data?.name || typeof command.execute !== "function") {
        console.warn(`⚠️ Skipped ${fullPath} (missing data.name/execute)`);
        continue;
      }
      client.commands.set(command.data.name, command);
      console.log(`✅ ${fullPath} Successfully Added`);
    }
  }
}

export default async function addCommands(client) {
  const commandsRoot = path.join(__dirname, "../commands");
  await loadCommandsFromDir(client, commandsRoot);
}
