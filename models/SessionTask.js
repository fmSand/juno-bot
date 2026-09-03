export default (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;

  const SessionTask = sequelize.define(
    "SessionTask",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      sessionId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "session_id",
        references: {
          model: "sessions",
          key: "id",
        },
      },
      taskId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "task_id",
        references: {
          model: "tasks",
          key: "id",
        },
      },
      completedDuringSession: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: "completed_during_session",
        comment: "Was this task marked as done during this session?",
      },
      notes: {
        type: DataTypes.TEXT,
        comment: "Notes about progress or blockers for this task",
      },
    },
    {
      tableName: "session_tasks",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["session_id", "task_id"],
          name: "uq__session_tasks__session_id_task_id",
        },
        {
          fields: ["task_id"],
          name: "ix__session_tasks__task_id",
        },
        {
          fields: ["session_id"],
          name: "ix__session_tasks__session_id",
        },
      ],
    },
  );

  SessionTask.associate = (models) => {
    SessionTask.belongsTo(models.Session, {
      foreignKey: "sessionId",
      as: "session",
      onDelete: "CASCADE",
    });

    SessionTask.belongsTo(models.Task, {
      foreignKey: "taskId",
      as: "task",
      onDelete: "CASCADE",
    });
  };

  return SessionTask;
};
