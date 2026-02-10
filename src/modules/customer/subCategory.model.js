module.exports = (sequelize, DataTypes) => {
  const SubCategory = sequelize.define(
    "SubCategory",
    {
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
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
      tableName: "sub_categories",
      schema: "app_data",   // 🔥 VERY IMPORTANT
      timestamps: false
    }
  );

  return SubCategory;
};
