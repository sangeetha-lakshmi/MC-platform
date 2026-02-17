const express = require("express");
const router = express.Router();
const customerController = require("../controller/customer.controller");
const auth = require("../middlewares/auth.middleware"); // ✅ ADD THIS


// ========================================
// Homepage — all nearby shops
// ========================================+

router.post(
  "/nearby-shops",
  customerController.getNearbyShops
);


// ========================================
// Search shops by category & Subcategory
// ========================================

router.post(
  "/nearby-shops-by-category",
  customerController.getNearbyShopsByCategory
);


// ========================================
// Search by shop name
// ========================================

router.get(
  "/search-shop",
  customerController.searchShop
);


// ========================================
// Search by Category only
// ========================================

router.post(
  "/category-shops",
  customerController.getCategoryShops
);


// ========================================
// Search by Food-Type (Veg / Non-Veg)
// ========================================

router.post(
  "/food-type-shops",
  customerController.getFoodTypeShops
);


// ========================================
// 🔥 Shop Click → Get Live Products
// ========================================

router.get(
  "/shop/:shopId/live-products",
  customerController.getLiveProductsByShop
);


// ========================================
// 🔥 Global Live Product Search
// ========================================

router.get(
  "/search-products",
  customerController.searchLiveProducts
);


/* ================= HOMEPAGE CATEGORIES ================= */
router.get("/categories", customerController.getHomepageCategories);


/* ================= HOMEPAGE SUB-CATEGORIES ================= */
router.get(
  "/subcategories/:category_id",
  customerController.getSubCategories
);


/* ================= ADD TO CART ================= */
router.post("/add-to-cart", customerController.addToCart);
router.get("/cart/:customer_id", customerController.getCartItems);


/* ================= PLACE ORDER ================= */
router.post("/place-order", customerController.placeOrder);


/* ================= 🔥 MY ORDERS (NEW) ================= */
router.get(
  "/my-orders",
  auth, // 🔐 require login
  customerController.getMyOrders
);


module.exports = router;
