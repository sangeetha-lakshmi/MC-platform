const customerService = require("../modules/customer/customer.service");

exports.getNearbyShopsByCategory = async (req, res) => {
  try {
    const { latitude, longitude, category, sub_category } = req.body;

    if (!latitude || !longitude || !category || !sub_category) {
      return res.status(400).json({
        message:
          "latitude, longitude, category and sub_category are required"
      });
    }

    const data =
      await customerService.getNearbyVendorsByCategoryAndSubCategory({
        customerLat: latitude,
        customerLng: longitude,
        category,
        subCategory: sub_category   // ✅ map API → DB
      });

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    console.error("NEARBY SHOPS ERROR 👉", error);
    res.status(500).json({
      message: "Unable to fetch nearby shops",
      error: error.message
    });
  }
};
