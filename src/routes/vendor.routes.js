const express = require("express");
const router = express.Router();

const vendorController = require("../controller/vendor.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const vendorApproved = require("../middlewares/vendorApproved.middleware");
const { toggleShopStatus } = require("../controller/vendor.controller");



// existing
router.post("/register", vendorController.registerVendor);
router.post("/login", vendorController.loginVendor);
router.patch(
  "/toggle-status",
  authMiddleware,
  vendorApproved,
  toggleShopStatus
);

// 🆕 profile routes
router.get(
  "/profile",
  authMiddleware,
  vendorApproved,
  vendorController.getVendorProfile
);

router.put(
  "/profile",
  authMiddleware,
  vendorApproved,
  vendorController.updateVendorProfile
);
router.put(
  "/update-order-status",
  authMiddleware,
  vendorApproved,
  vendorController.updateOrderStatus
);

module.exports = router;
