import { Status } from "discord.js";
import { QueryTypes } from "sequelize";

export default class HealthService {
  constructor(db) {
    this.sequelize = db.sequelize;
  }

  async check(client) {
    const [discord, database] = await Promise.all([
      this.#checkDiscord(client),
      this.#checkDatabase(),
    ]);

    return {
      ok: discord.ok && database.ok,
      at: new Date(),
      discord,
      database,
    };
  }

  #checkDiscord(client) {
    if (!client?.isReady()) {
      return { ok: false, reason: "client not ready" };
    }

    if (client.ws.status !== Status.Ready) {
      return { ok: false, reason: `ws status ${client.ws.status}` };
    }

    const ping = client.ws.ping;
    return { ok: true, pingMs: ping >= 0 ? Math.round(ping) : null };
  }

  async #checkDatabase() {
    const start = Date.now();
    try {
      const expected = this.sequelize.getDatabaseName();
      const [row] = await this.sequelize.query("SELECT current_database() AS db", {
        type: QueryTypes.SELECT,
      });
      const actual = row?.db;

      if (actual !== expected) {
        return {
          ok: false,
          reason: `connected to wrong database: ${actual} (expected ${expected})`,
        };
      }

      return { ok: true, latencyMs: Date.now() - start };
    } catch (err) {
      const reason = err?.message || err?.code || err?.name || String(err);
      return { ok: false, reason };
    }
  }
}
