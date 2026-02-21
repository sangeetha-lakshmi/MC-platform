const router = require("express").Router();
const otpController = require("../controller/otp.controller");

router.post("/send", otpController.sendPhoneOTP);
router.post("/verify/customer", otpController.verifyCustomerOTP);
router.post("/verify/vendor", otpController.verifyVendorOTP);
router.post("/verify/delivery", otpController.verifyDeliveryOTP);

module.exports = router;