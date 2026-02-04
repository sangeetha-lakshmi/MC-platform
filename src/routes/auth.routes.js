const router = require("express").Router();
const authController = require("../controller/auth.controller");

// 🔑 ONE LOGIN FOR ADMIN + VENDOR
router.post("/login", authController.login);

module.exports = router;
