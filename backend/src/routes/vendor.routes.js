const express = require("express");
const router = express.Router();

const vendorController = require("../controller/vendor.controller");

router.post("/register", vendorController.registerVendor);
router.post("/login", vendorController.loginVendor);

module.exports = router;
