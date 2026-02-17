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

    const customerId = req.user.id;   // 🔐 from token
    const { vendor_id, product_id, quantity } = req.body;

    if (!vendor_id || !product_id) {
      return res.status(400).json({
        message: "vendor_id and product_id required"
      });
    }

    await customerService.addToCart({
      customerId,
      vendorId: vendor_id,
      productId: product_id,
      quantity: quantity || 1
    });

    res.status(200).json({
      success: true,
      message: "Item added to cart"
    });

  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};

exports.getCartItems = async (req, res) => {

  const customerId = req.user.id;

  const data = await customerService.getCartItems(customerId);

  res.json({
    success: true,
    count: data.length,
    data
  });
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

    const customerId = req.user.id; // from auth middleware

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
