const router = require("express").Router();

const authController = require("../controller/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");


// 🔑 LOGIN (Admin / Vendor / Customer)
router.post("/login", authController.login);


// 👤 CUSTOMER REGISTER
router.post("/register/customer", authController.registerCustomer);


// ✏️ CUSTOMER PROFILE UPDATE (TOKEN REQUIRED)
router.put("/update", authMiddleware, authController.updateCustomerProfile);


// 🔐 FORGOT PASSWORD
router.post("/forgot-password", authController.forgotPassword);


// 📱 VERIFY OTP (Twilio)
router.post("/verify-otp", authController.verifyOTP);


// 🔄 RESET PASSWORD
router.post("/reset-password", authController.resetPassword);


// 🔍 VERIFY RESET TOKEN



module.exports = router;