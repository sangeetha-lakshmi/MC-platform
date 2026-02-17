const express = require("express");
const router = express.Router();

const { protect, adminOnly } = require("../middleware/authMiddleware");
const { getShops } = require("../controllers/adminShopController");

// ✅ Admin shop listing (industry standard)
router.get("/v1/admin/shops", protect, adminOnly, getShops);

module.exports = router;    
