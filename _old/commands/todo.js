const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = "./data/todos.json";

function getTodos() {
  if (!fs.existsSync(path)) return {};
  return JSON.parse(fs.readFileSync(path));
}

function saveTodos(todos) {
  fs.writeFileSync(path, JSON.stringify(todos, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("todo")
    .setDescription("Manage your personal task list")
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add a new task")
        .addStringOption((opt) =>
          opt
            .setName("task")
            .setDescription("The task to add")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List your current tasks")
    )
    .addSubcommand((sub) =>
      sub
        .setName("done")
        .setDescription("Mark a task as done")
        .addIntegerOption((opt) =>
          opt
            .setName("index")
            .setDescription("Task number (starts from 1)")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const todos = getTodos();
    if (!todos[userId]) todos[userId] = [];

    const sub = interaction.options.getSubcommand();

    if (sub === "add") {
      const task = interaction.options.getString("task");
      todos[userId].push({ task, done: false });
      saveTodos(todos);
      return interaction.reply(`Task added: "${task}"`);
    }

    if (sub === "list") {
      const userTodos = todos[userId];
      if (userTodos.length === 0) {
        return interaction.reply(" Your todo list is empty.");
      }

      const formatted = userTodos
        .map((t, i) => `${i + 1}. [${t.done ? "x" : " "}] ${t.task}`)
        .join("\n");
      return interaction.reply(` Your tasks:\n\`\`\`\n${formatted}\n\`\`\``);
    }

    if (sub === "done") {
      const index = interaction.options.getInteger("index") - 1;
      if (index < 0 || index >= todos[userId].length) {
        return interaction.reply("⚠️ Invalid task number.");
      }
      todos[userId][index].done = true;
      saveTodos(todos);
      return interaction.reply(` Marked task #${index + 1} as done.`);
    }
  },
};
