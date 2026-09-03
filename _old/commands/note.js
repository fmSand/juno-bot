const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = "./data/notes.json";

function getNotes() {
  if (!fs.existsSync(path)) return {};
  return JSON.parse(fs.readFileSync(path));
}

function saveNotes(notes) {
  fs.writeFileSync(path, JSON.stringify(notes, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("note")
    .setDescription("Save and manage personal notes")
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add a note")
        .addStringOption((opt) =>
          opt.setName("text").setDescription("Your note").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List your notes")
    )
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("Delete a note")
        .addIntegerOption((opt) =>
          opt
            .setName("index")
            .setDescription("Note number to delete")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const notes = getNotes();
    if (!notes[userId]) notes[userId] = [];

    const sub = interaction.options.getSubcommand();

    if (sub === "add") {
      const text = interaction.options.getString("text");
      notes[userId].push(text);
      saveNotes(notes);
      return interaction.reply(` Note added: "${text}"`);
    }

    if (sub === "list") {
      const userNotes = notes[userId];
      if (userNotes.length === 0) {
        return interaction.reply("📭 You don't have any notes.");
      }
      const formatted = userNotes.map((n, i) => `${i + 1}. ${n}`).join("\n");
      return interaction.reply(` Your notes:\n\`\`\`\n${formatted}\n\`\`\``);
    }

    if (sub === "delete") {
      const index = interaction.options.getInteger("index") - 1;
      if (index < 0 || index >= notes[userId].length) {
        return interaction.reply(" Invalid note number.");
      }
      const removed = notes[userId].splice(index, 1);
      saveNotes(notes);
      return interaction.reply(` Deleted note: "${removed}"`);
    }
  },
};
