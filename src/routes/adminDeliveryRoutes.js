const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminDelivery.controller");

router.get("/", adminController.getAllDeliveries); 

router.put("/approve/:id", adminController.approveDelivery);

router.delete("/:id", adminController.deleteDelivery);

router.put("/reset-password/:id", adminController.resetPassword);

module.exports = router;
