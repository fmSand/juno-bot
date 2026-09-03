export default (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;

  const SessionProject = sequelize.define(
    "SessionProject",
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
      projectId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "project_id",
        references: {
          model: "projects",
          key: "id",
        },
      },
      notes: {
        type: DataTypes.TEXT,
        comment: "Optional notes about work done on this project during session",
      },
    },
    {
      tableName: "session_projects",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["session_id", "project_id"],
          name: "uq__session_projects__session_id_project_id",
        },
        {
          fields: ["project_id"],
          name: "ix__session_projects__project_id",
        },
        {
          fields: ["session_id"],
          name: "ix__session_projects__session_id",
        },
        {
          fields: ["project_id", "updated_at"],
          name: "ix__session_projects__project_recent",
        },
      ],
    },
  );

  SessionProject.associate = (models) => {
    SessionProject.belongsTo(models.Session, {
      foreignKey: "sessionId",
      as: "session",
      onDelete: "CASCADE",
    });

    SessionProject.belongsTo(models.Project, {
      foreignKey: "projectId",
      as: "project",
      onDelete: "CASCADE",
    });
  };

  return SessionProject;
};
