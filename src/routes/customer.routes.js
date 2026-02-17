const express = require("express");
const router = express.Router();
const customerController = require("../controller/customer.controller");
const authMiddleware = require("../middlewares/auth.middleware");


// ========================================
// Homepage — all nearby shops
// ========================================

router.post(
  "/nearby-shops",authMiddleware,
  customerController.getNearbyShops
);


// ========================================
// Search shops by category & Subcategory
// ========================================

router.post(
  "/nearby-shops-by-category",authMiddleware,
  customerController.getNearbyShopsByCategory
);


// ========================================
// Search by shop name
// ========================================

router.get(
  "/search-shop",authMiddleware,
  customerController.searchShop
);


// ========================================
// Search by Category only
// ========================================

router.post(
  "/category-shops",authMiddleware,
  customerController.getCategoryShops
);


// ========================================
// Search by Food-Type (Veg / Non-Veg)
// ========================================

router.post(
  "/food-type-shops",authMiddleware, 
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


/* ================= HOMEPAGE CATEGORIES ================= */
router.get("/categories", authMiddleware, customerController.getHomepageCategories);

/* ================= HOMEPAGE SUB-CATEGORIES ================= */
router.get(
  "/subcategories/:category_id",
  authMiddleware,
  customerController.getSubCategories
);
/* ================= ADD TO CART ================= */
router.post("/add-to-cart",authMiddleware,customerController.addToCart);
router.get("/cart/:customer_id", authMiddleware, customerController.getCartItems);
router.post("/place-order", authMiddleware, customerController.placeOrder);


module.exports = router;
