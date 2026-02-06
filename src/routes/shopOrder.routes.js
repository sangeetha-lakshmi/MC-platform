const express = require("express");
const controller = require("../controller/shopOrder.controller");

const router = express.Router();

/* SHOP ORDER ROUTES */
router.get("/orders", controller.getOrders);
router.put("/orders/:id/accept", controller.acceptOrder);
router.put("/orders/:id/ready", controller.markReady);
router.put("/orders/:id/handed", controller.handOver);

module.exports = router;
