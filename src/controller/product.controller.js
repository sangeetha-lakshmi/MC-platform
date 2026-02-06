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
    category: ""
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
exports.create = async (req, res) => {
  const product = await service.createProduct(req.user.id, req.body);
  res.status(201).json(product);
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
