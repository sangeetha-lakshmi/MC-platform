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
        message: "latitude, longitude, category and sub_category are required"
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
  try {

    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        message: "latitude and longitude are required"
      });
    }

    const data = await customerService.getNearbyVendors({
      customerLat: Number(latitude),
      customerLng: Number(longitude)
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
// SEARCH SHOP BY NAME
// =====================================================

exports.searchShop = async (req, res) => {
  try {

    const { name } = req.query;

    if (!name) {
      return res.status(400).json({
        message: "Shop name is required"
      });
    }

    const data = await customerService.searchShopByName(name);

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// =====================================================
// CATEGORY SHOPS
// =====================================================

exports.getCategoryShops = async (req, res) => {
  try {

    const { latitude, longitude, category } = req.body;

    if (latitude === undefined || longitude === undefined || !category) {
      return res.status(400).json({
        message: "latitude, longitude and category are required"
      });
    }

    const data = await customerService.getShopsByCategory({
      customerLat: Number(latitude),
      customerLng: Number(longitude),
      category
    });

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });

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

    if (latitude === undefined || longitude === undefined || !foodType) {
      return res.status(400).json({
        message: "latitude, longitude and foodType are required"
      });
    }

    const data = await customerService.getVegNonVegShops({
      customerLat: Number(latitude),
      customerLng: Number(longitude),
      foodType
    });

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/* ================= GET HOMEPAGE CATEGORIES ================= */

exports.getHomepageCategories = async (req, res) => {
  try {

    const data = await customerService.getCategoriesWithSubCategories();

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });

  } catch (error) {

    console.error("CATEGORY ERROR 👉", error);

    res.status(500).json({
      message: "Unable to fetch categories",
      error: error.message
    });
  }
};


// =====================================================
// 🔥 SHOP CLICK → GET LIVE PRODUCTS
// =====================================================

exports.getLiveProductsByShop = async (req, res) => {
  try {

    const { shopId } = req.params;

    const products =
      await productService.getLiveProductsByShop(shopId);

    res.status(200).json(products);

  } catch (error) {

    console.error(error);

    res.status(500).json({ message: "Server Error" });
  }
};





/* ================= SUBCATEGORIES BY CATEGORY ================= */

exports.getSubCategories = async (req, res) => {
  try {

    const { category_id } = req.params;

    if (!category_id) {
      return res.status(400).json({
        message: "category_id is required"
      });
    }

    const data =
      await customerService.getSubCategoriesByCategory(category_id);

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });

  } catch (error) {
    console.error("SUBCATEGORY ERROR 👉", error);
    res.status(500).json({
      message: "Unable to fetch subcategories",
      error: error.message
    });
  }
};

/* ================= ADD TO CART ================= */
exports.addToCart = async (req, res) => {
  try {

    const customerId = req.user.id;          // 🔐 token
    const productId = req.params.productId;  // 📦 from URL
    const { quantity = 1 } = req.body;

    const result = await customerService.addToCart({
      customerId,
      productId,
      quantity
    });

    res.status(200).json({
      success: true,
      message: "Item added to cart",
      data: result
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/* ================= GET CART ITEMS ================= */
exports.getCartItems = async (req, res) => {
  try {

    const customerId = req.user.id;   // 🔐 from token
    console.log("TOKEN CUSTOMER ID 👉", req.user.id);

    const items = await customerService.getCartItems(customerId);

    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


/* ================= PLACE ORDER ================= */

exports.placeOrder = async (req, res) => {
  try {

    const customerId = req.user.id;

    if (isNaN(customerId)) {
      return res.status(400).json({
        message: "Valid customer_id required"
      });
    }

    const result =
      await customerService.placeOrder({ customerId });

    res.status(200).json(result);

  } catch (error) {

    res.status(400).json({
      message: error.message
    });
  }
};


/* ================= MY ORDERS ================= */

exports.getMyOrders = async (req, res) => {
  try {

    const customerId = req.user.id;

    const orders =
      await customerService.getCustomerOrders(customerId);

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (error) {
    console.error("MY ORDERS ERROR 👉", error);
    res.status(500).json({
      message: "Unable to fetch orders",
      error: error.message
    });
  }
};
exports.getHomepageNearbyShops = async (req, res) => {
  try {

    const customerId = req.user.id;  // 🔐 from token

    const shops =
      await customerService.getHomepageNearbyShops(customerId);

    res.json({
      success: true,
      count: shops.length,
      data: shops
    });

  } catch (error) {

    if (error.message === "Location not set") {
      return res.status(400).json({
        message: "Customer location not set"
      });
    }

    res.status(500).json({
      message: "Unable to fetch nearby shops",
      error: error.message
    });
  }
};
exports.updateLocation = async (req, res) => {
  try {

    const customerId = req.user.id;
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        message: "Latitude and longitude are required"
      });
    }

    await customerService.saveCustomerLocation({
      customerId,
      latitude,
      longitude
    });

    res.json({
      success: true,
      message: "Location updated successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: "Unable to update location",
      error: error.message
    });
  }
};
