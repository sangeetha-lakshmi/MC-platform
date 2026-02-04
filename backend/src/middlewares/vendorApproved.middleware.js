const pool = require("../config/database");

module.exports = async (req, res, next) => {
  const result = await pool.query(
    "SELECT is_approved FROM vendors WHERE id=$1",
    [req.user.id]
  );

  if (!result.rows[0].is_approved)
    return res.status(403).json({ message: "Not approved" });

  next();
};
