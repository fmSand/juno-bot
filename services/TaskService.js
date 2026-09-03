import { Op } from "sequelize";

const TASK_STATUS = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
  ARCHIVED: "archived",
};

const ALLOWED_STATUSES = Object.values(TASK_STATUS);

export default class TaskService {
  constructor(db) {
    this.client = db.sequelize;
    this.Task = db.Task;
    this.SessionTask = db.SessionTask;
    this.Session = db.Session;
    this.User = db.User;
    this.Project = db.Project;
  }

  _validateStatus(status) {
    if (!ALLOWED_STATUSES.includes(status)) {
      throw Object.assign(new Error(`Invalid status: ${status}`), {
        code: "INVALID_STATUS",
      });
    }
  }

  _getProjectInclude(attributes = ["id", "name"]) {
    return {
      model: this.Project,
      as: "project",
      attributes,
    };
  }

  async getActiveByUser(userId, { includeProject = false } = {}) {
    const options = {
      where: {
        userId,
        status: { [Op.in]: [TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS] },
      },
      order: [["updatedAt", "DESC"]],
    };

    if (includeProject) {
      options.include = [this._getProjectInclude()];
    }

    return this.Task.findAll(options);
  }

  async getById(taskId, userId, { includeProject = false } = {}) {
    const options = {
      where: { id: taskId, userId },
    };

    if (includeProject) {
      options.include = [this._getProjectInclude(["id", "name", "status"])];
    }

    return this.Task.findOne(options);
  }

  async getByUser(
    userId,
    { status = null, projectId = null, includeProject = false, limit = 50, offset = 0 } = {},
  ) {
    const where = { userId };

    if (status) {
      where.status = Array.isArray(status) ? { [Op.in]: status } : status;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    const statusOrder = this.client.literal(
      `CASE "Task"."status"
         WHEN '${TASK_STATUS.TODO}' THEN 1
         WHEN '${TASK_STATUS.IN_PROGRESS}' THEN 2
         WHEN '${TASK_STATUS.DONE}' THEN 3
         WHEN '${TASK_STATUS.ARCHIVED}' THEN 4
      END`,
    );

    const safeLimit = Math.min(Math.max(limit ?? 50, 1), 100);
    const safeOffset = Math.max(offset ?? 0, 0);

    const options = {
      where,
      order: [
        [statusOrder, "ASC"],
        ["updatedAt", "DESC"],
      ],
      limit: safeLimit,
      offset: safeOffset,
    };

    if (includeProject) {
      options.include = [this._getProjectInclude()];
    }

    return this.Task.findAll(options);
  }

  async create(
    userId,
    { title, description = null, projectId = null, status = TASK_STATUS.TODO, dueAt = null },
    { transaction } = {},
  ) {
    if (!title || typeof title !== "string") {
      throw Object.assign(new Error("Title is required"), { code: "INVALID_INPUT" });
    }

    let trimmedTitle = title.trim();
    if (!trimmedTitle) {
      throw Object.assign(new Error("Title cannot be empty"), { code: "INVALID_INPUT" });
    }

    this._validateStatus(status);

    return this.Task.create(
      {
        userId,
        title: trimmedTitle,
        description,
        projectId,
        status,
        dueAt: dueAt ? new Date(dueAt) : null,
      },
      { transaction },
    );
  }

  async updateStatus(taskId, userId, status, { transaction } = {}) {
    this._validateStatus(status);

    const [count, rows] = await this.Task.update(
      { status },
      {
        where: { id: taskId, userId },
        returning: true,
        validate: true,
        transaction,
      },
    );

    return count ? rows[0] : null;
  }

  async update(taskId, userId, updates, { transaction } = {}) {
    const cleanUpdates = {};

    if (updates.title !== undefined) {
      if (!updates.title || typeof updates.title !== "string") {
        throw Object.assign(new Error("Title is required"), { code: "INVALID_INPUT" });
      }
      let trimmedTitle = updates.title.trim();
      if (!trimmedTitle) {
        throw Object.assign(new Error("Title cannot be empty"), { code: "INVALID_INPUT" });
      }
      cleanUpdates.title = trimmedTitle;
    }

    if (updates.description !== undefined) {
      cleanUpdates.description = updates.description;
    }

    if (updates.projectId !== undefined) {
      cleanUpdates.projectId = updates.projectId;
    }

    if (updates.dueAt !== undefined) {
      cleanUpdates.dueAt = updates.dueAt ? new Date(updates.dueAt) : null;
    }

    if (updates.status !== undefined) {
      this._validateStatus(updates.status);
      cleanUpdates.status = updates.status;
    }

    const [count, rows] = await this.Task.update(cleanUpdates, {
      where: { id: taskId, userId },
      returning: true,
      validate: true,
      transaction,
    });

    return count ? rows[0] : null;
  }

  async archive(taskId, userId, { transaction } = {}) {
    const [count] = await this.Task.update(
      { status: TASK_STATUS.ARCHIVED },
      {
        where: { id: taskId, userId },
        validate: true,
        transaction,
      },
    );

    return count > 0;
  }

  async delete(taskId, userId, { transaction } = {}) {
    const count = await this.Task.destroy({
      where: { id: taskId, userId },
      transaction,
    });
    return count > 0;
  }

  async linkToActiveSession(userId, taskId) {
    return this.client.transaction(async (t) => {
      const task = await this.Task.findOne({
        where: { id: taskId, userId },
        transaction: t,
      });

      if (!task) return null;

      const session = await this.Session.findOne({
        where: { userId, endedAt: null },
        transaction: t,
      });

      if (!session) return null;

      const [sessionTask, wasCreated] = await this.SessionTask.findOrCreate({
        where: { sessionId: session.id, taskId },
        defaults: { sessionId: session.id, taskId },
        transaction: t,
      });

      if (!wasCreated) {
        await sessionTask.update({ updatedAt: new Date() }, { transaction: t });
      }

      return sessionTask;
    });
  }

  async getCurrentTaskForSession(sessionId) {
    const sessionTask = await this.SessionTask.findOne({
      where: { sessionId },
      include: [
        {
          model: this.Task,
          as: "task",
          include: [this._getProjectInclude()],
        },
      ],
      order: [["updatedAt", "DESC"]],
    });

    return sessionTask?.task ?? null;
  }

  async getTasksForSession(sessionId) {
    const sessionTasks = await this.SessionTask.findAll({
      where: { sessionId },
      include: [
        {
          model: this.Task,
          as: "task",
          include: [this._getProjectInclude()],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    return sessionTasks.map((st) => ({
      task: st.task,
      completedDuringSession: st.completedDuringSession,
      notes: st.notes,
      linkedAt: st.createdAt,
    }));
  }
}

export { TASK_STATUS, ALLOWED_STATUSES };
