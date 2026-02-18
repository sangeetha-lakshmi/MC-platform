const pool = require("../../config/database");

/* =====================================================
   SAFE DISTANCE FORMULA
===================================================== */

const DIST = `
6371 * acos(
  LEAST(
    1,
    GREATEST(
      -1,
      cos(radians($1))
      * cos(radians(v.latitude))
      * cos(radians(v.longitude) - radians($2))
      + sin(radians($1))
      * sin(radians(v.latitude))
    )
  )
)
`;

/* =====================================================
   NEARBY VENDORS BY CATEGORY + SUBCATEGORY
===================================================== */

exports.getNearbyVendorsByCategoryAndSubCategory = async ({
  customerLat,
  customerLng,
  category,
  subCategory,
  radius = 4
}) => {

  const query = `
    SELECT *
    FROM (
      SELECT
        v.id AS vendor_id,
        v.shop_name,
        ROUND((${DIST})::numeric, 2) AS distance,
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
        AND p.subcategory = $4
        AND p.is_live = true
        AND v.is_online = true
        AND v.is_approved = 'approved'
        AND v.latitude IS NOT NULL
        AND v.longitude IS NOT NULL
      GROUP BY v.id
    ) AS results
    WHERE distance <= $5
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


/* =====================================================
   NEARBY VENDORS
===================================================== */

exports.getNearbyVendors = async ({
  customerLat,
  customerLng,
  radius = 4
}) => {

  const query = `
    SELECT *
    FROM (
      SELECT
        v.id,
        v.shop_name,
        v.business_type,
        v.latitude,
        v.longitude,
        ROUND((${DIST})::numeric, 2) AS distance
      FROM vendors v
      WHERE
        v.is_approved = 'approved'
        AND v.is_online = true
        AND v.latitude IS NOT NULL
        AND v.longitude IS NOT NULL
    ) AS results
    WHERE distance <= $3
    ORDER BY distance ASC
  `;

  const result = await pool.query(query, [
    customerLat,
    customerLng,
    radius
  ]);

  return result.rows;
};


/* =====================================================
   SEARCH SHOP BY NAME (UNCHANGED)
===================================================== */

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


/* =====================================================
   SHOPS BY CATEGORY
===================================================== */

exports.getShopsByCategory = async ({
  customerLat,
  customerLng,
  category,
  radius = 4
}) => {

  const query = `
    SELECT *
    FROM (
      SELECT
        v.id,
        v.shop_name,
        v.business_type,
        ROUND((${DIST})::numeric, 2) AS distance
      FROM vendors v
      WHERE
        v.business_type = $3
        AND v.is_approved = 'approved'
        AND v.is_online = true
        AND v.latitude IS NOT NULL
        AND v.longitude IS NOT NULL
    ) AS results
    WHERE distance <= $4
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


/* =====================================================
   VEG / NON-VEG SHOPS
===================================================== */

exports.getVegNonVegShops = async ({
  customerLat,
  customerLng,
  foodType,
  radius = 4
}) => {

  const query = `
    SELECT *
    FROM (
      SELECT DISTINCT
        v.id,
        v.shop_name,
        ROUND((${DIST})::numeric, 2) AS distance
      FROM vendors v
      JOIN products p ON p.vendor_id = v.id
      WHERE
        p.food_type = $3
        AND p.is_live = true
        AND v.is_approved = 'approved'
        AND v.is_online = true
        AND v.latitude IS NOT NULL
        AND v.longitude IS NOT NULL
    ) AS results
    WHERE distance <= $4
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


/* =====================================================
   CATEGORIES WITH SUBCATEGORIES (UNCHANGED)
===================================================== */

exports.getCategoriesWithSubCategories = async () => {

  const query = `
    SELECT
      c.id AS category_id,
      c.name AS category_name,
      c.icon AS category_icon,
      json_agg(
        json_build_object(
          'sub_id', s.id,
          'name', s.name,
          'icon', s.icon
        )
      ) AS sub_categories
    FROM app_data.categories c
    LEFT JOIN app_data.sub_categories s
      ON s.category_id = c.id
      AND s.is_active = TRUE
    WHERE c.is_active = TRUE
    GROUP BY c.id
    ORDER BY c.id
  `;

  const result = await pool.query(query);

  return result.rows;
};


/* =====================================================
   SUBCATEGORIES BY CATEGORY (UNCHANGED)
===================================================== */

exports.getSubCategoriesByCategory = async (categoryId) => {

  const query = `
    SELECT id, name, icon
    FROM app_data.sub_categories
    WHERE category_id = $1
      AND is_active = TRUE
    ORDER BY id
  `;

  const result = await pool.query(query, [categoryId]);

  return result.rows;
};
