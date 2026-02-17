const pool = require("../../config/database");

exports.getNearbyVendorsByCategoryAndSubCategory = async ({
  customerLat,
  customerLng,
  category,
  subCategory,
  radius = 5
}) => {
  const query = `
    SELECT
      v.id AS vendor_id,
      v.shop_name,
      ROUND(
        6371 * acos(
          cos(radians($1))
          * cos(radians(v.latitude))
          * cos(radians(v.longitude) - radians($2))
          + sin(radians($1))
          * sin(radians(v.latitude))
        )::numeric,
        2
      ) AS distance,
      json_agg(
        json_build_object(
          'product_id', p.id,
          'name', p.name,
          'price', p.price
        )
      ) AS products
    FROM vendors v
    JOIN products p ON p.vendor_id = v.id
    WHERE
      p.category = $3
      AND p.subcategory = $4     -- ✅ CORRECT
      AND p.is_live = true
      AND v.is_online = true
      AND v.is_approved = 'approved'  -- ✅ CORRECT
    GROUP BY v.id
    HAVING
      6371 * acos(
        cos(radians($1))
        * cos(radians(v.latitude))
        * cos(radians(v.longitude) - radians($2))
        + sin(radians($1))
        * sin(radians(v.latitude))
      ) <= $5
    ORDER BY distance ASC
  `;

  const result = await pool.query(query, [
    customerLat,
    customerLng,
    category,
    subCategory,
    radius
  ]);

  return result.rows;
};
exports.getNearbyVendors = async ({
  customerLat,
  customerLng,
  radius = 5
}) => {
  const query = `
    SELECT
      v.id,
      v.shop_name,
      v.business_type,
      v.latitude,
      v.longitude,
      ROUND(
        6371 * acos(
          cos(radians($1))
          * cos(radians(v.latitude))
          * cos(radians(v.longitude) - radians($2))
          + sin(radians($1))
          * sin(radians(v.latitude))
        )::numeric,
        2
      ) AS distance
    FROM vendors v
    WHERE
      v.is_approved = 'approved'
      AND v.is_online = true
      AND 6371 * acos(
        cos(radians($1))
        * cos(radians(v.latitude))
        * cos(radians(v.longitude) - radians($2))
        + sin(radians($1))
        * sin(radians(v.latitude))
      ) <= $3
    ORDER BY distance ASC
  `;

  const result = await pool.query(query, [
    customerLat,
    customerLng,
    radius
  ]);

  return result.rows;
};

exports.searchShopByName = async (name) => {
  const query = `
    SELECT *
    FROM vendors
    WHERE LOWER(shop_name) LIKE LOWER($1)
      AND is_approved = 'approved'
      AND is_online = true
  `;

  const result = await pool.query(query, [`%${name}%`]);
  return result.rows;
};
exports.getShopsByCategory = async ({
  customerLat,
  customerLng,
  category,
  radius = 5
}) => {
  const query = `
    SELECT
      v.id,
      v.shop_name,
      v.business_type,
      ROUND(
        6371 * acos(
          cos(radians($1))
          * cos(radians(v.latitude))
          * cos(radians(v.longitude) - radians($2))
          + sin(radians($1))
          * sin(radians(v.latitude))
        )::numeric,
        2
      ) AS distance
    FROM vendors v
    WHERE
      v.business_type = $3
      AND v.is_approved = 'approved'
      AND v.is_online = true
      AND v.latitude IS NOT NULL
      AND v.longitude IS NOT NULL
      AND (
        6371 * acos(
          cos(radians($1))
          * cos(radians(v.latitude))
          * cos(radians(v.longitude) - radians($2))
          + sin(radians($1))
          * sin(radians(v.latitude))
        )
      ) <= $4
    ORDER BY distance ASC
  `;

  const result = await pool.query(query, [
    customerLat,
    customerLng,
    category,
    radius
  ]);

  return result.rows;
};

exports.getVegNonVegShops = async ({
  customerLat,
  customerLng,
  foodType,
  radius = 5
}) => {
  const query = `
    SELECT DISTINCT
      v.id,
      v.shop_name,
      ROUND(
        6371 * acos(
          cos(radians($1))
          * cos(radians(v.latitude))
          * cos(radians(v.longitude) - radians($2))
          + sin(radians($1))
          * sin(radians(v.latitude))
        )::numeric,
        2
      ) AS distance
    FROM vendors v
    JOIN products p ON p.vendor_id = v.id
    WHERE
      p.food_type = $3
      AND p.is_live = true
      AND v.is_approved = 'approved'
      AND v.is_online = true
      AND v.latitude IS NOT NULL
      AND v.longitude IS NOT NULL
      AND (
        6371 * acos(
          cos(radians($1))
          * cos(radians(v.latitude))
          * cos(radians(v.longitude) - radians($2))
          + sin(radians($1))
          * sin(radians(v.latitude))
        )
      ) <= $4
    ORDER BY distance ASC
  `;

  const result = await pool.query(query, [
    customerLat,
    customerLng,
    foodType,
    radius
  ]);

  return result.rows;
};
