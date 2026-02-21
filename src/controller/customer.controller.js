const customerService = require("../modules/customer/customer.service");
const productService = require("../modules/vendor/product.service");

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

    const products = await productService.getLiveProductsByShop(shopId);

    res.status(200).json(products);

  } catch (error) {

    console.error(error);

    res.status(500).json({ message: "Server Error" });
  }
};


// =====================================================
// 🔥 GLOBAL LIVE PRODUCT SEARCH
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

    res.status(200).json(result);

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

    const customerId = req.user.id;
    console.log("TOKEN CUSTOMER ID 👉", customerId);

    const result = await customerService.getCartItems(customerId);

    // 🔥 Return directly
    res.status(200).json(result);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

/* ================= PLACE ORDER ================= */

exports.placeOrder = async (req, res) => {
  try {

    console.log("BODY 👉", req.body);

    const customerId = req.user.id;

    if (isNaN(customerId)) {
      return res.status(400).json({
        message: "Valid customer_id required"
      });
    }

    const result =
      await customerService.placeOrder({
        customerId
      });

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
