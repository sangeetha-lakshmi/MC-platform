const express = require("express");
const router = express.Router();
const customerController = require("../controller/customer.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// ========================================
// 🔥 Shop Click → Get Live Products
// ========================================

router.get(
  "/shop/:shopId/live-products",
  authMiddleware,
  customerController.getLiveProductsByShop
);



/* ================= HOMEPAGE CATEGORIES ================= */

router.get(
  "/categories",
  authMiddleware,
  customerController.getHomepageCategories
);


/* ================= HOMEPAGE SUB-CATEGORIES ================= */

router.get(
  "/subcategories/:category_id",
  authMiddleware,
  customerController.getSubCategories
);


/* ================= ADD TO CART ================= */
router.post(
  "/cart/:productId",
  authMiddleware,
  customerController.addToCart
);
router.get("/cart", authMiddleware, customerController.getCartItems);
router.post("/place-order", authMiddleware, customerController.placeOrder);


/* ================= 🔥 MY ORDERS ================= */

router.get(
  "/my-orders",
  authMiddleware,
  customerController.getMyOrders
);


router.get(
  "/homepage",
  authMiddleware,
  customerController.getHomepageNearbyShops
);

router.put(
  "/location",
  authMiddleware,
  customerController.updateLocation
);

module.exports = router;
