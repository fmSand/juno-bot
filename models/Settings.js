export default (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;

  const Settings = sequelize.define(
    "Settings",
    {
      userId: {
        type: DataTypes.UUID,
        primaryKey: true,
        field: "user_id",
        references: {
          model: "users",
          key: "id",
        },
      },
      preferences: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: "All user preferences (personas, notifications, etc.)",
      },
    },
    {
      tableName: "settings",
      timestamps: true,
      underscored: true,
    },
  );

  Settings.associate = (models) => {
    Settings.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
      onDelete: "CASCADE",
    });
  };

  return Settings;
};
