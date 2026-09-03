const DailyScheduler = require("../utils/dailyScheduler");

module.exports = {
  name: "ready",
  once: true,
  execute(client) {
    console.log(`Logged in as ${client.user.tag}`);
    
    // Start the daily summary scheduler
    const dailyScheduler = new DailyScheduler(client);
    dailyScheduler.start();
    
    // Store the scheduler instance on the client for potential future use
    client.dailyScheduler = dailyScheduler;
    
    console.log("🤖 Juno Bot is ready and daily scheduler is active!");
  },
};
