const { fetch } = require("undici");
const { ollamaUrl, ollamaModel } = require("../../config.json");

function parseMessage(message) {
  let content = message.content;

  if (message.embeds.length > 0) {
    message.embeds.forEach((embed) => {
      if (embed.title) content += `\nEmbed Title: ${embed.title}`;
      if (embed.description) content += `\nEmbed Description: ${embed.description}`;
      if (embed.fields.length > 0) {
        content += "\nEmbed Fields:";
        embed.fields.forEach((field) => {
          content += `\n- ${field.name}: ${field.value}`;
        });
      }
    });
  }

  if (message.attachments.size > 0) {
    content += `\n[${message.attachments.size} attachment(s)]`;
  }

  const timestamp = message.createdAt.toLocaleString("en-US", { timeZone: "UTC", hour12: false });
  return `[${timestamp}] ${message.author.username}: ${content}`;
}

async function summarizeText(text, prompt, num_predict = 400) {
  const fullPrompt = `${prompt}\n\n${text}`;
  console.log(`Sending ${fullPrompt.length} chars to AI with num_predict=${num_predict}...`);

  try {
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes timeout

    console.log(`Making request to ${ollamaUrl}/api/generate...`);
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: fullPrompt,
        stream: false,
        options: {
          num_predict: num_predict,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log(`Response received with status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Response data received, checking for response field...");

    if (data && data.response) {
      console.log("AI response received.");
      return data.response.trim();
    } else {
      console.error("Invalid response from Ollama:", data);
      return "Error: Could not get a valid summary from the AI.";
    }
  } catch (error) {
    console.error("Error calling Ollama API:", error.message);
    if (error.name === "AbortError") {
      return "Error: Request timed out after 10 minutes. The AI server might be starting up or processing a large request.";
    }
    return `Error summarizing text: ${error.message}`;
  }
}

async function summarizeMessages(messages, interaction) {
  if (messages.size === 0) {
    return "No messages found to summarize.";
  }

  const formattedMessages = messages
    .map(parseMessage)
    .filter((content) => content.length > 0)
    .join("\n");

  if (formattedMessages.length === 0) {
    return "Found messages, but they were all empty after parsing.";
  }

  console.log(`Total content length for summarization: ${formattedMessages.length} characters.`);

  const CHUNK_SIZE = 8000; // 8k characters per chunk
  const chunks = [];
  for (let i = 0; i < formattedMessages.length; i += CHUNK_SIZE) {
    chunks.push(formattedMessages.substring(i, i + CHUNK_SIZE));
  }

  console.log(`Splitting content into ${chunks.length} chunks.`);

  if (chunks.length === 1) {
    await interaction.editReply("Found messages, now summarizing...");
    return await summarizeText(chunks[0], "Summarize the following chat messages:", 1000);
  }

  const chunkSummaries = [];
  for (let i = 0; i < chunks.length; i++) {
    await interaction.editReply(`Summarizing chunk ${i + 1} of ${chunks.length}...`);
    // Using default num_predict (400) for intermediate chunks
    const chunkSummary = await summarizeText(
      chunks[i],
      "Summarize the following chat messages in a concise paragraph:"
    );
    if (chunkSummary.startsWith("Error")) {
      return `Error processing chunk ${i + 1}: ${chunkSummary}`;
    }
    chunkSummaries.push(chunkSummary);
  }

  await interaction.editReply("Combining summaries...");
  const combinedSummaries = chunkSummaries.join("\n\n");
  console.log(`Combined summaries length: ${combinedSummaries.length} characters.`);

  // Using a larger num_predict for the final, combined summary
  const finalSummary = await summarizeText(
    combinedSummaries,
    "Combine these summaries into a single, cohesive, final summary of the entire conversation:",
    1000
  );

  return finalSummary;
}

module.exports = { summarizeMessages, parseMessage };
