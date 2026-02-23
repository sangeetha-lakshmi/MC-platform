const express = require("express");
const router = express.Router();
const otpController = require("../controller/otp.controller");

const deliveryController = require("../controller/delivery.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/* ================= REGISTER ================= */

router.post("/register", deliveryController.registerDeliveryPartner);

/* ================= DELIVERY ACTIVE TOGGLE ================= */

router.patch(
  "/toggle-active",
  authMiddleware,
  deliveryController.toggleActiveStatus
);

/* ================= PROFILE ================= */

router.get(
  "/profile",
  authMiddleware,
  deliveryController.getProfile
);

router.put(
  "/profile",
  authMiddleware,
  deliveryController.updateProfile
);

/* ================= ORDERS ================= */

router.get(
  "/available-orders",
  authMiddleware,
  deliveryController.getAvailableOrders
);

router.put(
  "/accept-order",
  authMiddleware,
  deliveryController.acceptOrder
);

router.put(
  "/picked-order",
  authMiddleware,
  deliveryController.markAsPicked
);

router.put(
  "/complete-order",
  authMiddleware,
  deliveryController.markAsDelivered
);
// delivery person phone update
router.post(
  "/verify-phone-update",
  authMiddleware,
  otpController.verifyDeliveryOTP
);
module.exports = router;