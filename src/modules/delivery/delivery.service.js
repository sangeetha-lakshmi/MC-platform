const bcrypt = require("bcrypt");
const db = require("../../config/database");

const register = async (data) => {

  const {
    name,
    email,
    phone,
    password,
    aadhar_number,
    pan_number,
    vehicle_type,
    vehicle_number,
    driving_license_url   // ← URL instead of file
  } = data;

  if (!name) throw new Error("Name is required");
  if (!email) throw new Error("Email is required");
  if (!phone) throw new Error("Phone number is required");
  if (!password) throw new Error("Password cannot be empty");
  if (!vehicle_type) throw new Error("Vehicle type is required");
  if (!vehicle_number) throw new Error("Vehicle number is required");
  if (!driving_license_url) {
    throw new Error("Driving license upload is required");
  }

  // Phone validation
  if (!/^[0-9]{10}$/.test(phone)) {
    throw new Error("Phone number must contain 10 digits only");
  }

  // Password minimum length
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  /* ===========================
     CHECK DUPLICATE EMAIL
  ============================ */

  const existing = await db.query(
    "SELECT id FROM delivery_partners WHERE email = $1",
    [email]
  );

  if (existing.rows.length > 0) {
    throw new Error("Email already registered");
  }

  /* ===========================
     HASH PASSWORD
  ============================ */

  const hashedPassword = await bcrypt.hash(password, 10);

  /* ===========================
     INSERT INTO DATABASE
  ============================ */

  // rest of validation...

await db.query(
    `INSERT INTO delivery_partners
     (name,email,phone,password_hash,
      aadhar_number,pan_number,
      vehicle_type,vehicle_number,
      driving_license_photo,
      is_approved, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending',NOW())`,
    [
      name,
      email,
      phone,
      hashedPassword,
      aadhar_number || null,
      pan_number || null,
      vehicle_type,
      vehicle_number,
      driving_license_url
    ]
  );
};

module.exports = {
  register
};
