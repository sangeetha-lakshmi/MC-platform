const express = require("express");
const router = express.Router();

const deliveryController = require("../controller/delivery.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/* ================= AUTH ================= */

router.post("/register", deliveryController.registerDeliveryPartner);
router.put("/change-password/:id", deliveryController.changePassword);

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

/* ================= STAGE 7 - READY ORDERS ================= */

router.get(
  "/available-orders",
  authMiddleware,
  deliveryController.getAvailableOrders
);

/* ================= STAGE 8 - ACCEPT ORDER ================= */

router.put(
  "/orders/:orderId/accept",
  authMiddleware,
  deliveryController.acceptOrder
);
/* ================= STAGE 9 - MARK PICKED ================= */

router.put(
  "/orders/:orderId/picked",
  authMiddleware,
  deliveryController.markAsPicked
);

/* ================= STAGE 10 - MARK COMPLETED ================= */

router.put(
  "/orders/:orderId/complete",
  authMiddleware,
  deliveryController.markAsDelivered
);

module.exports = router;