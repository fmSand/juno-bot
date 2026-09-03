import { LRUCache } from "lru-cache";

const userCache = new LRUCache({ max: 500, ttl: 1000 * 60 * 15 });

export default class UserService {
  constructor(db) {
    this.client = db.sequelize;
    this.User = db.User;
  }

  async getAll() {
    return this.User.findAll();
  }

  async getOneDiscordId(discordId) {
    const cached = userCache.get(discordId);
    if (cached !== undefined) return cached;
    const user = await this.User.findOne({ where: { discordId } });
    if (user) userCache.set(discordId, user);
    return user;
  }

  async getOneId(id) {
    return this.User.findOne({
      where: { id },
    });
  }

  async create({ discordId, githubUsername, name }) {
    return this.User.create({ discordId, githubUsername, name });
  }

  async updateById(id, args) {
    return this.User.update({ ...args }, { where: { id } });
  }

  async updateByDiscordId(discordId, args) {
    return this.User.update({ ...args }, { where: { discordId } });
  }
}
