const customerService = require("../modules/customer/customer.service");
const productService = require("../modules/vendor/product.service");


// =====================================================
// NEARBY SHOPS BY CATEGORY + SUBCATEGORY
// =====================================================

exports.getNearbyShopsByCategory = async (req, res) => {
  try {

    const { latitude, longitude, category, sub_category } = req.body;

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


// =====================================================
// NEARBY SHOPS
// =====================================================

exports.getNearbyShops = async (req, res) => {
  const { latitude, longitude } = req.body;

  const data = await customerService.getNearbyVendors({
    customerLat: latitude,
    customerLng: longitude
  });

  res.json(data);
};


// =====================================================
// SEARCH SHOP BY NAME
// =====================================================

exports.searchShop = async (req, res) => {
  const { name } = req.query;

  const data = await customerService.searchShopByName(name);
  res.json(data);
};


// =====================================================
// CATEGORY SHOPS
// =====================================================

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


// =====================================================
// VEG / NON-VEG SHOPS
// =====================================================

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


// =====================================================
// 🔥 SHOP CLICK → GET LIVE PRODUCTS
// =====================================================

exports.getLiveProductsByShop = async (req, res) => {
  try {
    const { shopId } = req.params;

    const products = await productService.getLiveProductsByShop(shopId);

    res.status(200).json(products);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};



// =====================================================
// 🔥🔥🔥 NEW FUNCTION ADDED
// 🔍 GLOBAL LIVE PRODUCT SEARCH
// =====================================================

exports.searchLiveProducts = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        message: "Search query is required"
      });
    }

    const products =
      await productService.searchLiveProducts(query);

    res.status(200).json(products);

  } catch (error) {
    console.error("SEARCH ERROR 👉", error);
    res.status(500).json({
      message: "Unable to search products",
      error: error.message
    });
  }
};
