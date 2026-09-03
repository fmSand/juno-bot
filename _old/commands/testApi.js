const { SlashCommandBuilder } = require("discord.js");
const { fetch } = require("undici");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("test-api")
    .setDescription("Test the AI API directly"),

  async execute(interaction) {
    await interaction.deferReply();

    const testPrompt = `
Summarize this simple test message in 2-3 bullet points.

Test message:
This is a test message to check if the AI API is working correctly. The team discussed some project updates and made decisions about the upcoming sprint planning.

`;

    try {
      console.log("🧪 Testing AI API...");
      
      const response = await fetch("https://juno-ollama.fly.dev/api/generate", {
        method: "POST",
        body: JSON.stringify({
          model: "tinyllama",
          prompt: testPrompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 200
          }
        }),
        headers: { "Content-Type": "application/json" },
      });

      console.log("📡 API Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error:", errorText);
        return interaction.editReply(`❌ **API Test Failed**\n\nStatus: ${response.status}\nError: ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ API Response received:", data);

      if (!data.response) {
        return interaction.editReply(`❌ **API Test Failed**\n\nNo response field in API response:\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``);
      }

      const summary = data.response.trim();
      
      await interaction.editReply(`✅ **API Test Successful!**\n\n**Test Summary:**\n${summary}\n\n**API Response Details:**\n• Status: ${response.status}\n• Model: ${data.model || 'tinyllama'}\n• Response length: ${summary.length} characters`);

    } catch (error) {
      console.error("❌ API Test Error:", error);
      await interaction.editReply(`❌ **API Test Failed**\n\nError: ${error.message}\n\nThis suggests the AI service might be offline or unreachable.`);
    }
  },
}; 