const router = require("express").Router();
const otpController = require("../controller/otp.controller");

router.post("/send", otpController.sendPhoneOTP);
router.post("/verify", otpController.verifyPhoneOTP);

module.exports = router;