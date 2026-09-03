export default (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;

  const ProjectMember = sequelize.define(
    "ProjectMember",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      projectId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "project_id",
        references: {
          model: "projects",
          key: "id",
        },
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
      isAdmin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "is_admin",
      },
      canAddLinks: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "can_add_links",
      },
      permissions: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: "Additional permissions for the member",
      },
      joinedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
        field: "joined_at",
      },
    },
    {
      tableName: "project_members",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["project_id", "user_id"],
          name: "uq__project_members__project_id_user_id",
        },
        {
          fields: ["project_id", "is_admin"],
          name: "ix__project_members__project_id_is_admin",
        },
      ],
    },
  );

  ProjectMember.associate = (models) => {
    ProjectMember.belongsTo(models.Project, {
      foreignKey: "projectId",
      as: "project",
    });

    ProjectMember.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
  };

  return ProjectMember;
};
