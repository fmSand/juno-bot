import { Client, GatewayIntentBits, Collection, Events } from "discord.js";
import { restoreTimersOnStartup } from "./features/session/restoreTimers.js";
import addCommands from "./utils/addCommands.js";
import addEvents from "./utils/addEvents.js";
import { required } from "./utils/envHelpers.js";
// import { required, parseIds } from "./utils/envHelpers.js";
import addJobs from "./utils/addJobs.js";
import { adminDb } from "./models/index.js";
import services from "./services/index.js";
import { initializeLiveDashboard } from "./features/liveDashboard/setupOnStartup.js";

// ---- Read ENV ----
const TOKEN = required("token");
// const STATUS_CHANNEL_ID = required("statusChannelId");
// const SUMMARY_CHANNEL_ID = required("chatSummaryChannelId");
// const SOURCE_CHANNEL_IDS = parseIds(required("sourceChannelIds"));
// Optional (used by aiSummary.js likely)
// const OLLAMA_URL = process.env.ollamaUrl;
// const OLLAMA_MODEL = process.env.ollamaModel;

// --- Client Setup ----
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// ---- Database Initialization (Phase 1: Sync) ----
console.log("Initializing database...");
await adminDb.sequelize.authenticate();
console.log("✓ Database connected.");

if (process.env.NODE_ENV !== "production") {
  await adminDb.sequelize.sync({ alter: true });
  console.log("✓ Database synced.");
}

// Attach services to interactions for calling on interaction.services[service]
client.prependListener(Events.InteractionCreate, (interaction) => {
  interaction.services = services;
});

// Load commands, events & add cron jobs
console.log("Loading bot components...");
await addCommands(client);
await addEvents(client);

client.once("ready", async (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  await restoreTimersOnStartup(client);
  await initializeLiveDashboard(client);
  addJobs(client);
});

// Log in bot
await client.login(TOKEN);
