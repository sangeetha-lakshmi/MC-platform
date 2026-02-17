const express = require("express");
const router = express.Router();
const customerController = require("../controller/customer.controller");

// Homepage — all nearby shops
router.post("/nearby-shops", customerController.getNearbyShops);

// Search shops by category & Subcategory
router.post(
  "/nearby-shops-by-category",
  customerController.getNearbyShopsByCategory
);

// Search by shop name
router.get("/search-shop", customerController.searchShop);

// search by Category only
router.post("/category-shops", customerController.getCategoryShops);

// search by Food-Type(veg or Non-veg)
router.post("/food-type-shops", customerController.getFoodTypeShops);

module.exports = router;
