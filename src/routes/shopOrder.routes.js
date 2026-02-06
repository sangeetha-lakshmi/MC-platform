const express = require("express");
const controller = require("../controller/shopOrder.controller");

const router = express.Router();

router.get("/orders", controller.getOrders);
router.put("/orders/:id/accept", controller.acceptOrder);
router.put("/orders/:id/ready", controller.markReady);
router.put("/orders/:id/completed", controller.completeOrder);

module.exports = router;
