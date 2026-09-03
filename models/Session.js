export default (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;

  const Session = sequelize.define(
    "Session",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
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
      activity: {
        type: DataTypes.TEXT,
        comment: "What the user is working on / Status message",
      },
      startedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "started_at",
        comment: "Set at punch-in",
      },
      endedAt: {
        type: DataTypes.DATE,
        field: "ended_at",
        comment: "NULL while active, set at punch-out",
      },
      targetDurationMinutes: {
        type: DataTypes.INTEGER,
        field: "target_duration_minutes",
        comment: "Optional user intended session length",
        validate: {
          min: 1,
          max: 480,
        },
      },
      autoEnded: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: "auto_ended",
      },
    },
    {
      tableName: "sessions",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["user_id"],
          where: { ended_at: null },
          name: "uq__sessions__user_id__ended_at_null",
        },
        {
          fields: ["user_id", "started_at"],
          name: "ix__sessions__user_started_at",
        },
      ],
    },
  );

  Session.associate = (models) => {
    Session.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
      onDelete: "CASCADE",
    });

    Session.belongsToMany(models.Project, {
      through: models.SessionProject,
      foreignKey: "sessionId",
      otherKey: "projectId",
      as: "projects",
    });

    Session.belongsToMany(models.Task, {
      through: models.SessionTask,
      foreignKey: "sessionId",
      otherKey: "taskId",
      as: "tasks",
    });

    Session.hasMany(models.SessionProject, {
      foreignKey: "sessionId",
      as: "sessionProjects",
      onDelete: "CASCADE",
    });

    Session.hasMany(models.SessionTask, {
      foreignKey: "sessionId",
      as: "sessionTasks",
      onDelete: "CASCADE",
    });

    Session.hasMany(models.Notification, {
      foreignKey: "sessionId",
      as: "notifications",
      onDelete: "CASCADE",
    });
  };

  return Session;
};
