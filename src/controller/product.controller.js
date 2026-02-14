const service = require("../modules/vendor/product.service");
const db = require("../config/database");

// default data for "Add Product" page
exports.getProductTemplate = (req, res) => {
  res.json({
    name: "",
    description: "",
    image: "",
    price: 0,
    discount: 0,
    stock: 0,
    is_live: false,
    prep_time: "",
    food_type: "VEG",
    category: "",
    subcategory: ""
  });
};

// get all products of logged-in vendor
exports.getAll = async (req, res) => {
  const products = await service.getAllProducts(req.user.id);
  res.json(products);
};

// get single product (edit)
exports.getOne = async (req, res) => {
  const product = await service.getProductById(req.params.id);
  res.json(product);
};

// create product
const { DEFAULT_PRODUCT_IMAGE } = require("../constants/defaults");

exports.create = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ✅ IMAGE HANDLING (ALL CASES)
    let image = DEFAULT_PRODUCT_IMAGE;

    // Case 1: Image uploaded
    if (req.file) {
      image = req.file.filename;
    }

    // Case 2: Frontend sends image URL/string
    if (req.body.image && typeof req.body.image === "string") {
      image = req.body.image;
    }

    const product = await service.createProduct(req.user.id, {
      ...req.body,
      image,
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("Create Product Error:", err.message);
    res.status(500).json({ message: "Failed to create product" });
  }
};



// update product
exports.update = async (req, res) => {
  const product = await service.updateProduct(req.params.id, req.body);
  res.json(product);
};

// delete product
exports.remove = async (req, res) => {
  await service.deleteProduct(req.params.id);
  res.json({ message: "Product deleted" });
};

// PATCH: toggle product live status
exports.updateLiveStatus = async (req, res) => {
  const { is_live } = req.body;

  if (typeof is_live !== "boolean") {
    return res.status(400).json({
      message: "is_live must be true or false"
    });
  }

  const product = await service.updateLiveStatus(
    req.params.id,
    is_live
  );

  res.json(product);
};

exports.addProductByAdmin = async (req, res) => {
  try {
    const vendorId = req.params.vendorId;

    const {
      name,
      description,
      image,
      price,
      final_price,
      stock,
      preparing_minutes,
      food_type,
      subcategory
    } = req.body;

    /* ===============================
       BASIC VALIDATION
    ================================ */

    if (!name) throw new Error("Product name is required");
    if (!price) throw new Error("Original price is required");
    if (!final_price) throw new Error("Final price is required");

    if (Number(final_price) > Number(price)) {
      throw new Error("Final price cannot be greater than original price");
    }

    /* ===============================
       FETCH SHOP TYPE
    ================================ */

    const vendorResult = await db.query(
      `SELECT business_type FROM vendors WHERE id = $1`,
      [vendorId]
    );

    if (vendorResult.rows.length === 0) {
      return res.status(404).json({ message: "Vendor not found" });
    }
const shopType = vendorResult.rows[0].business_type;
// Get category_id from categories table


// Validate subcategory belongs to this category
if (!subcategory) {
  throw new Error("Subcategory is required");
}



    /* ===============================
       FOOD vs NON-FOOD LOGIC
    ================================ */

    if (shopType === "Food") {

      if (!preparing_minutes) {
        throw new Error("Preparing minutes required for food items");
      }

      finalPreparingMinutes = preparing_minutes;
      finalFoodType = food_type || null;
      finalStock = 0; // not used

    } else {

      if (stock === undefined || stock === null) {
        throw new Error("Stock is required for non-food items");
      }

      finalStock = stock;
      finalPreparingMinutes = 0;
      finalFoodType = null;
    }

    /* ===============================
       INSERT PRODUCT
    ================================ */

    const { rows } = await db.query(
      `INSERT INTO products (
        vendor_id,
        name,
        description,
        image,
        price,
        final_price,
        stock,
        is_live,
        preparing_minutes,
        food_type,
        category,
        subcategory,
        created_at,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())
      RETURNING *`,
      [
        vendorId,
        name,
        description || null,
        image || "image.jpg",
        price,
        final_price,
        finalStock,
        true,
        finalPreparingMinutes,
        finalFoodType,
        shopType,
        subcategory
      ]
    );

    res.status(201).json(rows[0]);

  } catch (error) {
    console.error("Admin Add Product Error:", error.message);
    res.status(400).json({ message: error.message });
  }
};


exports.updateProductByAdmin = async (req, res) => {
  try {
    const productId = req.params.id;

    const {
      name,
      description,
      price,
      discount,
      stock,
      category,
      subcategory,
      is_live
    } = req.body;

    const { rowCount, rows } = await db.query(
      `UPDATE products SET
        name = $1,
        description = $2,
        price = $3,
        discount = $4,
        stock = $5,
        category = $6,
        subcategory = $7,
        is_live = $8,
        updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        name,
        description,
        price,
        final_price,
        stock,
        category,
        subcategory,
        is_live,
        productId
      ]
    );

    if (rowCount === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json(rows[0]);

  } catch (error) {
    console.error("Admin Update Product Error:", error);
    res.status(500).json({ message: "Error updating product" });
  }
};
;

exports.deleteProductByAdmin = async (req, res) => {
  try {
    const productId = req.params.id;

    await db.query(
      "DELETE FROM products WHERE id = $1",
      [productId]
    );

    res.json({
      message: "Product deleted successfully by admin"
    });

  } catch (error) {
    console.error("Admin Delete Product Error:", error);
    res.status(500).json({ message: "Error deleting product" });
  }
};
