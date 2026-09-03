export default (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;

  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      discordId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "discord_id",
        validate: {
          notEmpty: true,
        },
        comment: "Discord snowflake ID",
      },
      githubUsername: {
        type: DataTypes.STRING,
        field: "github_username",
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
    },
    {
      tableName: "users",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["discord_id"],
          name: "uq__users__discord_id",
        },
        {
          unique: true,
          fields: ["github_username"],
          name: "uq__users__github_username",
        },
      ],
    },
  );

  User.associate = (models) => {
    User.belongsToMany(models.Project, {
      through: models.ProjectMember,
      foreignKey: "userId",
      otherKey: "projectId",
      as: "projects",
    });

    User.hasOne(models.Settings, {
      foreignKey: "userId",
      as: "settings",
      onDelete: "CASCADE",
    });

    User.hasMany(models.ProjectMember, {
      foreignKey: "userId",
      as: "projectMembers",
      onDelete: "CASCADE",
    });

    User.hasMany(models.Session, {
      foreignKey: "userId",
      as: "sessions",
      onDelete: "CASCADE",
    });

    User.hasMany(models.Task, {
      foreignKey: "userId",
      as: "tasks",
      onDelete: "CASCADE",
    });

    User.hasMany(models.Notification, {
      foreignKey: "userId",
      as: "notifications",
      onDelete: "CASCADE",
    });
  };

  return User;
};
