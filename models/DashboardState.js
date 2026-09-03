export default (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;

  const DashboardState = sequelize.define(
    "DashboardState",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      channelId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "channel_id",
        comment: "Discord channel ID",
      },
      messageId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "message_id",
        comment: "Discord message ID for the dashboard",
      },
    },
    {
      tableName: "live_dashboard",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["channel_id"],
          name: "uq__live_dashboard__channel_id",
        },
      ],
    },
  );

  return DashboardState;
};
