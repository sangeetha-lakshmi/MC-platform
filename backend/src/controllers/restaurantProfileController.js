exports.updateRestaurantProfile = async (req, res) => {
  try {
    const restaurantId = req.user.id;

    const {
      cuisine_type,
      gst_number,
      opening_time,
      closing_time,
      bank_account,
      ifsc_code,
    } = req.body;

    await pool.query(
      `UPDATE restaurants SET
        cuisine_type=$1,
        gst_number=$2,
        opening_time=$3,
        closing_time=$4,
        bank_account=$5,
        ifsc_code=$6
      WHERE id=$7`,
      [
        cuisine_type,
        gst_number,
        opening_time,
        closing_time,
        bank_account,
        ifsc_code,
        restaurantId,
      ]
    );

    res.json({
      message: "Restaurant profile updated successfully ✅",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
