const express = require("express");
const router = express.Router();

const controller = require("../controller/commonCategory");

// common for customer + shop
router.get("/categories", controller.getCategories);
router.get("/categories/:categoryId/subcategories", controller.getSubCategories);

module.exports = router;
