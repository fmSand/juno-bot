export default (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;

  const Task = sequelize.define(
    "Task",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "user_id",
        references: {
          model: "users",
          key: "id",
        },
      },
      projectId: {
        type: DataTypes.UUID,
        field: "project_id",
        references: {
          model: "projects",
          key: "id",
        },
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 200],
        },
      },
      description: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "todo",
        validate: {
          isIn: [["todo", "in_progress", "done", "archived"]],
        },
      },
      dueAt: {
        type: DataTypes.DATE,
        field: "due_at",
      },
    },
    {
      tableName: "tasks",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ["user_id", "status"],
          name: "ix__tasks__user_status",
        },
        {
          fields: ["project_id", "status"],
          name: "ix__tasks__project_status",
        },
      ],
    },
  );

  Task.associate = (models) => {
    Task.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
      onDelete: "CASCADE",
    });

    Task.belongsTo(models.Project, {
      foreignKey: "projectId",
      as: "project",
      onDelete: "CASCADE",
    });

    Task.belongsToMany(models.Session, {
      through: models.SessionTask,
      foreignKey: "taskId",
      otherKey: "sessionId",
      as: "sessions",
    });

    Task.hasMany(models.SessionTask, {
      foreignKey: "taskId",
      as: "sessionTasks",
      onDelete: "CASCADE",
    });
  };

  return Task;
};
