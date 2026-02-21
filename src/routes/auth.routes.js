const router = require("express").Router();
const authController = require("../controller/auth.controller");

// 🔑 ONE LOGIN FOR ADMIN + VENDOR
router.post("/login", authController.login);
router.post("/register/customer", authController.registerCustomer);
router.put("/update/:id", authController.updateCustomerProfile);
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-otp", authController.verifyOTP);
router.post("/reset-password", authController.resetPassword);
router.get("/verify-reset/:token", authController.verifyResetToken);

module.exports = router;
