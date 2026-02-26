const express = require("express");
const controller = require("../controller/shopOrder.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/orders", authMiddleware, controller.getOrders);
router.put("/orders/:id/accept", authMiddleware, controller.acceptOrder);
router.put("/orders/:id/ready", authMiddleware, controller.markReady);
router.put("/orders/:id/completed", authMiddleware, controller.completeOrder);

module.exports = router;
