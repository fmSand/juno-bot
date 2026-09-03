import cron from "node-cron";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function addJobs(client) {
  const jobsDir = path.join(__dirname, "../jobs");
  const files = fs.readdirSync(jobsDir).filter((f) => f.endsWith(".js"));

  for (const file of files) {
    const jobPath = path.join(jobsDir, file);
    const mod = await import(pathToFileURL(jobPath).href);
    const job = mod.default ?? mod;

    if (!job?.schedule || !job?.task) {
      console.warn(`⚠️ Skipped job ${file}: missing schedule/task`);
      continue;
    }

    cron.schedule(job.schedule, () => job.task(client), {
      timezone: "Europe/Oslo",
    });
  }
}
