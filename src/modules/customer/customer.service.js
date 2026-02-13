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
