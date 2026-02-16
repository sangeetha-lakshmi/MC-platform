const bcrypt = require("bcrypt");
const db = require("../../config/database");

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

  const duplicateCheck = await db.query(
    `SELECT id FROM delivery_partners 
     WHERE email = $1 
        OR phone = $2
        OR driving_license_number = $3
        OR aadhar_number = $4
        OR pan_number = $5`,
    [
      email,
      phone,
      driving_license_number,
      aadhar_number || null,
      pan_number || null
    ]
  );

  if (duplicateCheck.rows.length > 0) {
    throw new Error("Duplicate record detected (Email / Phone / DL / Aadhar / PAN)");
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
      is_approved, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending',NOW())`,
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
