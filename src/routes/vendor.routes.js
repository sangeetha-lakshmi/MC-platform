const express = require("express");
const router = express.Router();
const vendorController = require("../controller/vendor.controller");
const otpController = require("../controller/otp.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

const authMiddleware = require("../middlewares/auth.middleware");
const vendorApproved = require("../middlewares/vendorApproved.middleware");
const { toggleShopStatus } = require("../controller/vendor.controller");


// ================= REGISTER & LOGIN =================

router.post("/register", vendorController.registerVendor);
router.post("/login", vendorController.loginVendor);


// ================= TOGGLE SHOP ONLINE/OFFLINE =================

router.patch(
  "/toggle-status",
  authMiddleware,
  vendorApproved,
  toggleShopStatus
);


// ================= PROFILE ROUTES =================

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


// ================= 🔥 STAGE 3 — INCOMING ORDERS =================

router.get(
  "/orders",
  authMiddleware,
  vendorApproved,
  vendorController.getIncomingOrders
);

//updatevendor_phonenumber

router.post(
  "/verify-phone-update",
  authMiddleware,
  vendorApproved,
  otpController.verifyVendorOTP
);

// ================= UPDATE ORDER STATUS =================

router.put(
  "/update-order-status",
  authMiddleware,
  vendorApproved,
  vendorController.updateOrderStatus
);


module.exports = router;
