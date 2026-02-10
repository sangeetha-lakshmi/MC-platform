module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    "Category",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      icon: DataTypes.STRING,
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      tableName: "categories",
      schema: "app_data",   // 🔥 VERY IMPORTANT
      timestamps: false
    }
  );

  return Category;
};
