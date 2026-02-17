const express = require("express");
const router = express.Router();
const customerController = require("../controller/customer.controller");


// ========================================
// Homepage — all nearby shops
// ========================================

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
// 🔥 NEW: Global Live Product Search
// ========================================

router.get(
  "/search-products",
  customerController.searchLiveProducts
);


module.exports = router;
