const customerService = require("../modules/customer/customer.service");

exports.getNearbyShopsByCategory = async (req, res) => {
  try {

    const { latitude, longitude, category, sub_category } = req.body;

    // ✅ Better validation
    if (
      latitude === undefined ||
      longitude === undefined ||
      !category ||
      !sub_category
    ) {
      return res.status(400).json({
        message:
          "latitude, longitude, category and sub_category are required"
      });
    }

    // ✅ Call service
    const data =
      await customerService.getNearbyVendorsByCategoryAndSubCategory({
        customerLat: Number(latitude),
        customerLng: Number(longitude),
        category: category.trim(),
        subCategory: sub_category.trim()
      });

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });

  } catch (error) {

    console.error("NEARBY SHOPS ERROR 👉", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch nearby shops",
      error: error.message
    });
  }
};
exports.getNearbyShops = async (req, res) => {
  const { latitude, longitude } = req.body;

  const data = await customerService.getNearbyVendors({
    customerLat: latitude,
    customerLng: longitude
  });

  res.json(data);
};
exports.searchShop = async (req, res) => {
  const { name } = req.query;

  const data = await customerService.searchShopByName(name);
  res.json(data);
};
exports.getCategoryShops = async (req, res) => {
  try {
    const { latitude, longitude, category } = req.body;

    const data = await customerService.getShopsByCategory({
      customerLat: latitude,
      customerLng: longitude,
      category
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getFoodTypeShops = async (req, res) => {
  try {
    const { latitude, longitude, foodType } = req.body;

    const data = await customerService.getVegNonVegShops({
      customerLat: latitude,
      customerLng: longitude,
      foodType
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
