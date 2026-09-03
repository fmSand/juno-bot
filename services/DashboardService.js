export default class DashboardService {
  constructor(db) {
    this.DashboardState = db.DashboardState;
  }

  getByChannel(channelId) {
    return this.DashboardState.findOne({ where: { channelId } });
  }

  async upsert(channelId, messageId) {
    const [record] = await this.DashboardState.upsert(
      { channelId, messageId },
      { returning: true },
    );
    return record;
  }

  remove(channelId) {
    return this.DashboardState.destroy({ where: { channelId } });
  }

  getAll() {
    return this.DashboardState.findAll();
  }
}
