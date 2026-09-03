export default {
  schedule: "0 9 * * *",
  task: (client) => {
    const channel = client.channels.cache.get(process.env.statusChannelId);
    if (channel) channel.send("☀️ Good morning Juniors! Let's have a productive day!");
  },
};
