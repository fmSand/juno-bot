export default (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;

  const Link = sequelize.define(
    "Link",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      projectId: {
        type: DataTypes.UUID,
        field: "project_id",
        references: {
          model: "projects",
          key: "id",
        },
      },
      kind: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "other",
        validate: { notEmpty: true },
        comment: "Category for the link (e.g., github, figma, docs etc.)",
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isUrl: true,
          notEmpty: true,
        },
      },
      description: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: "links",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["project_id", "url"],
          name: "uq__links__project_id_url",
        },
        {
          fields: ["project_id"],
          name: "ix__links__project_id",
        },
      ],
    },
  );

  Link.associate = (models) => {
    Link.belongsTo(models.Project, {
      foreignKey: "projectId",
      as: "project",
      onDelete: "CASCADE",
    });
  };

  return Link;
};
