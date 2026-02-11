const express = require("express");
const router = express.Router();
const customerController = require("../controller/customer.controller");

router.post(
  "/nearby-shops",
  customerController.getNearbyShopsByCategory
);


module.exports = router;
