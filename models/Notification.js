export default (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;

  const Notification = sequelize.define(
    "Notification",
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
      projectId: {
        type: DataTypes.UUID,
        field: "project_id",
        references: {
          model: "projects",
          key: "id",
        },
        comment: "Links to project for project-specific notifications (e.g., GitHub PRs)",
      },
      sessionId: {
        type: DataTypes.UUID,
        field: "session_id",
        references: {
          model: "sessions",
          key: "id",
        },
        comment: "Links notification to a session - auto-cancel when session ends",
      },
      channelId: {
        type: DataTypes.STRING,
        field: "channel_id",
        comment: "If set, send notification to a specific channel instead of DM",
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 100],
        },
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [
            [
              "session_reminder",
              "idle_warning",
              "event_reminder",
              "task_due",
              "pr_notification",
              "github_activity",
            ],
          ],
        },
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      sendAt: {
        type: DataTypes.DATE,
        field: "send_at",
        comment: "NULL = send immediately, future date = scheduled",
      },
      scheduleCron: {
        type: DataTypes.STRING,
        field: "schedule_cron",
        comment: "For repeating notifications",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "is_active",
        comment: "Set to false to pause or cancel this notification without deleting it",
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "queued",
        validate: {
          isIn: [["queued", "scheduled", "locked", "sent", "canceled", "error"]],
        },
      },
    },
    {
      tableName: "notifications",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ["user_id", "send_at"],
          name: "ix__notifications__user_sendat",
        },
        {
          fields: ["schedule_cron"],
          where: { is_active: true },
          name: "ix__notifications__cron__active",
        },
      ],
    },
  );

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
      onDelete: "CASCADE",
    });

    Notification.belongsTo(models.Project, {
      foreignKey: "projectId",
      as: "project",
      constraints: false,
    });

    Notification.belongsTo(models.Session, {
      foreignKey: "sessionId",
      as: "session",
      constraints: false,
      onDelete: "CASCADE",
    });
  };

  return Notification;
};
