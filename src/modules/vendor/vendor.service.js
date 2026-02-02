const pool = require("../../config/database");

/**
 * Create a new vendor
 */
exports.createVendor = async ({
  shop_name,
  owner_name,
  email,
  phone,
  password_hash,
  business_type,
  address,
  opening_time,
  closing_time,
  shop_logo,
  license_doc
}) => {
  return pool.query(
    `
    INSERT INTO public.vendors (
      shop_name,
      owner_name,
      email,
      phone,
      password_hash,
      business_type,
      address,
      opening_time,
      closing_time,
      shop_logo,
      license_doc
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    `,
    [
      shop_name,
      owner_name,
      email,
      phone,
      password_hash,
      business_type,
      address,
      opening_time,
      closing_time,
      shop_logo,
      license_doc
    ]
  );
};

/**
 * Find vendor by email
 */
exports.findVendorByEmail = async (email) => {
  const result = await pool.query(
    `SELECT * FROM public.vendors WHERE email = $1`,
    [email]
  );

  return result.rows[0];
};

