import "dotenv/config";
import { REST, Routes } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { required } from "./utils/envHelpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKEN = required("token");
const CLIENT_ID = required("clientId");
const GUILD_ID = required("guildId");

const commands = [];

async function loadCommandsRecursively(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await loadCommandsRecursively(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      const mod = await import(pathToFileURL(fullPath).href);
      const command = mod.default ?? mod;
      if (!command?.data?.name) {
        console.warn(`⚠️ Skipped ${fullPath} (missing data.name)`);
        continue;
      }
      commands.push(command.data.toJSON());
    }
  }
}

await loadCommandsRecursively(path.join(__dirname, "commands"));

const rest = new REST({ version: "10" }).setToken(TOKEN);

try {
  console.log("🔄 Refreshing application (/) commands...");

  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });

  console.log(`✅ Successfully reloaded ${commands.length} commands.`);
} catch (err) {
  console.error("❌ Failed to register commands:", err);
}
