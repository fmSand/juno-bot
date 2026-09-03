import "dotenv/config";

export const ollamaTrigger = {
  match: (message) => {
    if (message.author.bot) return false;

    const content = message.content.toLowerCase();
    return ["troll bot", "bot"].some((word) => content.startsWith(word));
  },

  run: async (message) => {
    try {
      const url = `${process.env.OLLAMA_URL || "http://localhost:11434"}/api/generate`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL || "llama3",
          prompt: message.content,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      return message.channel.send(data.response || "No response from model.");
    } catch (err) {
      return message.channel.send(
        `An error occurred while trying to generate a response: ${err.message}`,
      );
    }
  },
};
