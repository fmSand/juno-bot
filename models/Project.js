export default (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;

  const Project = sequelize.define(
    "Project",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 100],
        },
      },
      description: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "active",
        validate: {
          isIn: [["active", "paused", "archived"]],
        },
      },
    },
    {
      tableName: "projects",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["name"],
          name: "uq__projects__name",
        },
      ],
    },
  );

  Project.associate = (models) => {
    Project.belongsToMany(models.User, {
      through: models.ProjectMember,
      foreignKey: "projectId",
      otherKey: "userId",
      as: "members",
    });

    Project.belongsToMany(models.Session, {
      through: models.SessionProject,
      foreignKey: "projectId",
      otherKey: "sessionId",
      as: "sessions",
    });

    Project.hasMany(models.ProjectMember, {
      foreignKey: "projectId",
      as: "projectMembers",
      onDelete: "CASCADE",
    });

    Project.hasMany(models.Link, {
      foreignKey: "projectId",
      as: "links",
      onDelete: "CASCADE",
    });

    Project.hasMany(models.SessionProject, {
      foreignKey: "projectId",
      as: "sessionProjects",
      onDelete: "CASCADE",
    });

    Project.hasMany(models.Task, {
      foreignKey: "projectId",
      as: "tasks",
    });
  };

  return Project;
};
