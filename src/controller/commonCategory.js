const pool = require("../config/database");

// GET all categories (for customer + shop)
exports.getCategories = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, icon
       FROM app_data.categories
       WHERE is_active = true
       ORDER BY id`
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET sub categories by category
exports.getSubCategories = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const result = await pool.query(
      `SELECT id, name, icon
       FROM app_data.sub_categories
       WHERE category_id = $1
         AND is_active = true
       ORDER BY id`,
      [categoryId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
