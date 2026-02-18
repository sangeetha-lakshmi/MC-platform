const router = require("express").Router();
const authController = require("../controller/auth.controller");

// 🔑 ONE LOGIN FOR ADMIN + VENDOR
router.post("/login", authController.login);
router.post("/register/customer", authController.registerCustomer);

router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);


module.exports = router;
