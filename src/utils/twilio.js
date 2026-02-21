const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

/* ================= SEND OTP ================= */
exports.sendOTP = async (phone) => {
  phone = String(phone);
  try {
    // 🔹 Ensure phone is in E.164 format
    if (!phone.startsWith("+")) {
      phone = "+91" + phone;   // Change country code if needed
    }

    console.log("Sending OTP to:", phone);
    console.log("Using Service SID:", serviceSid);

    const response = await client.verify.v2
      .services(serviceSid)
      .verifications
      .create({
        to: phone,
        channel: "sms",
      });

    console.log("Twilio Response:", response.status);

    return response;

  } catch (error) {
    console.error("TWILIO SEND OTP ERROR:", error.message);
    throw error;
  }
};

/* ================= VERIFY OTP ================= */
exports.verifyOTP = async (phone, code) => {
  try {
    if (!phone.startsWith("+")) {
      phone = "+91" + phone;
    }

    const response = await client.verify.v2
      .services(serviceSid)
      .verificationChecks
      .create({
        to: phone,
        code,
      });

    console.log("Verification Status:", response.status);

    return response;

  } catch (error) {
    console.error("TWILIO VERIFY OTP ERROR:", error.message);
    throw error;
  }
};
//rashitha