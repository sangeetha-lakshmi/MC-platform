const pool = require("../../config/database");

exports.createVendor = async ({ owner_name, email, password_hash, business_type }) => {
  return pool.query(
    `INSERT INTO public.vendors
     (owner_name, email, password_hash, business_type)
     VALUES ($1, $2, $3, $4)`,
    [owner_name, email, password_hash, business_type]
  );
};

exports.findVendorByEmail = async (email) => {
  const result = await pool.query(
    "SELECT * FROM public.vendors WHERE email=$1",
    [email]
  );
  return result.rows[0];
};
