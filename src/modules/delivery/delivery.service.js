const bcrypt = require("bcrypt");
const db = require("../../config/database");
const { sendOTP } = require("../../utils/twilio");

const register = async (data) => {

  const {
    name,
    email,
    phone,
    aadhar_number,
    pan_number,
    vehicle_type,
    vehicle_number,
    driving_license_number
  } = data;

  /* ================= VALIDATIONS ================= */

  if (!name) throw new Error("Name is required");
  if (!email) throw new Error("Email is required");
  if (!phone) throw new Error("Phone number is required");

  if (!aadhar_number && !pan_number) {
    throw new Error("Either Aadhar number or PAN number is required");
  }

  if (!vehicle_type) throw new Error("Vehicle type is required");
  if (!vehicle_number) throw new Error("Vehicle number is required");
  if (!driving_license_number) {
    throw new Error("Driving license number is required");
  }

  // Phone validation
  if (!/^[0-9]{10}$/.test(phone)) {
    throw new Error("Phone number must contain 10 digits only");
  }

  // DL validation
  const dlRegex = /^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$/;
  if (!dlRegex.test(driving_license_number)) {
    throw new Error("Invalid driving license number format");
  }

  // PAN validation (if provided)
  if (pan_number) {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(pan_number)) {
      throw new Error("Invalid PAN format");
    }
  }

  // Aadhar validation (if provided)
  if (aadhar_number) {
    const aadharRegex = /^[0-9]{12}$/;
    if (!aadharRegex.test(aadhar_number)) {
      throw new Error("Invalid Aadhar format");
    }
  }

 /* ================= DUPLICATE CHECKS ================= */

// 1️⃣ Email check
const emailCheck = await db.query(
  "SELECT id, phone, phone_verified FROM delivery_partners WHERE email = $1",
  [email]
);

if (emailCheck.rows.length > 0) {

  const existing = emailCheck.rows[0];

  // If not verified → resend OTP
  if (!existing.phone_verified) {
    await sendOTP(existing.phone);

    return {
      message: "Email already registered but not verified. OTP resent."
    };
  }

  throw new Error("Email already registered");
}


// 2️⃣ Phone check
const phoneCheck = await db.query(
  "SELECT id, phone_verified FROM delivery_partners WHERE phone = $1",
  [phone]
);

if (phoneCheck.rows.length > 0) {

  const existing = phoneCheck.rows[0];

  if (!existing.phone_verified) {
    await sendOTP(phone);

    return {
      message: "Phone already registered but not verified. OTP resent."
    };
  }

  throw new Error("Phone number already registered");
}


// 3️⃣ Driving License check
const dlCheck = await db.query(
  "SELECT id FROM delivery_partners WHERE driving_license_number = $1",
  [driving_license_number]
);

if (dlCheck.rows.length > 0) {
  throw new Error("Driving license already registered");
}


// 4️⃣ Aadhar check
if (aadhar_number) {
  const aadharCheck = await db.query(
    "SELECT id FROM delivery_partners WHERE aadhar_number = $1",
    [aadhar_number]
  );

  if (aadharCheck.rows.length > 0) {
    throw new Error("Aadhar already registered");
  }
}


// 5️⃣ PAN check
if (pan_number) {
  const panCheck = await db.query(
    "SELECT id FROM delivery_partners WHERE pan_number = $1",
    [pan_number]
  );

  if (panCheck.rows.length > 0) {
    throw new Error("PAN already registered");
  }
}

  /* ================= GENERATE UNIQUE PROFILE ID ================= */

  let profileId;
  let exists = true;

  while (exists) {
    profileId =
      name.toLowerCase().replace(/\s+/g, "") +
      Math.floor(1000 + Math.random() * 9000);

    const checkProfile = await db.query(
      "SELECT id FROM delivery_partners WHERE profile_id = $1",
      [profileId]
    );

    exists = checkProfile.rows.length > 0;
  }

  /* ================= INSERT ================= */

  await db.query(
  `INSERT INTO delivery_partners
   (name,email,phone,
    aadhar_number,pan_number,
    vehicle_type,vehicle_number,
    driving_license_number,
    profile_id,
    phone_verified,
    is_approved,
    is_active,
    created_at)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,false,'pending',false,NOW())`,

    [
      name,
      email,
      phone,
      aadhar_number || null,
      pan_number || null,
      vehicle_type,
      vehicle_number,
      driving_license_number,
      profileId
    ]
  );
};
module.exports = {
  register
};
