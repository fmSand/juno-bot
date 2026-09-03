import {
  SlashCommandBuilder,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
} from "discord.js";
import { buildTaskDashboard } from "../../features/tasks/taskDashboardUI.js";
import { fetchFilteredTasks } from "../../events/interaction/features/tasks/task-dashboard-helpers.js";
import { TASK_STATUS } from "../../services/TaskService.js";

export default {
  data: new SlashCommandBuilder()
    .setName("my-tasks")
    .setDescription("View and manage your tasks")
    .addStringOption((option) =>
      option
        .setName("filter")
        .setDescription("Filter tasks by status")
        .setRequired(false)
        .addChoices(
          { name: "Active (Todo + In Progress)", value: "active" },
          { name: "Todo only", value: TASK_STATUS.TODO },
          { name: "In Progress only", value: TASK_STATUS.IN_PROGRESS },
          { name: "Done", value: TASK_STATUS.DONE },
          { name: "All Tasks", value: "all" },
        ),
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const { taskService } = interaction.services;
      const { user } = interaction.botContext;

      const filter = interaction.options.getString("filter") || "active";
      const tasks = await fetchFilteredTasks(taskService, user.id, filter);
      const payload = buildTaskDashboard(tasks, { filter });

      await interaction.editReply(payload);
    } catch (err) {
      console.error("[my-tasks] Error:", err);

      const errorContainer = new ContainerBuilder()
        .setAccentColor(0xe74c3c)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("Something went wrong loading your tasks."),
        );

      await interaction.editReply({
        components: [errorContainer],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
      });
    }
  },
};
