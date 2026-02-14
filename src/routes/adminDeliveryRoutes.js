const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminDelivery.controller");

router.get("/", adminController.getAlldelivery_partners); 

router.put("/approve/:id", adminController.approveDelivery);

router.put("/decline/:id", adminController.declineDelivery);

router.delete("/:id", adminController.deleteDelivery);

router.put("/reset-password/:id", adminController.resetPassword);

router.put("/edit-profile-id/:id", adminController.editProfileId);


module.exports = router;
