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
    driving_license_photo
  } = data;

  /* ===========================
     VALIDATIONS
  ============================ */

  if (!name) throw new Error("Name is required");
  if (!email) throw new Error("Email is required");
  if (!phone) throw new Error("Phone number is required");
  if (!vehicle_type) throw new Error("Vehicle type is required");
  if (!vehicle_number) throw new Error("Vehicle number is required");
  if (!driving_license_photo)
    throw new Error("Driving license upload is required");

  if (!/^[0-9]{10}$/.test(phone)) {
    throw new Error("Phone number must contain 10 digits only");
  }

  /* ===========================
     DUPLICATE EMAIL CHECK
  ============================ */

  const existing = await db.query(
    "SELECT id FROM delivery_partners WHERE email = $1",
    [email]
  );

  if (existing.rows.length > 0) {
    throw new Error("Email already registered");
  }

  /* ===========================
     GENERATE PROFILE ID
  ============================ */

  const profileId =
    name.toLowerCase().replace(/\s+/g, "") +
    Math.floor(1000 + Math.random() * 9000);

  /* ===========================
     INSERT INTO DATABASE
  ============================ */
await db.query(
  `INSERT INTO delivery_partners
  (name,email,phone,
   aadhar_number,pan_number,
   vehicle_type,vehicle_number,
   driving_license_photo,
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
    driving_license_photo,
    profileId
  ]
);

 
};


module.exports = {
  register
};
