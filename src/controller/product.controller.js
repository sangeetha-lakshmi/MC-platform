const service = require("../modules/vendor/product.service");

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
    prep_time: 15,
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
