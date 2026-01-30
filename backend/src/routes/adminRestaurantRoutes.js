const express = require("express");
const router = express.Router();

const { protect, adminOnly } = require("../middleware/authMiddleware");

const {
  getPendingRestaurants,
  approveRestaurant,
  rejectRestaurant,
} = require("../controllers/adminRestaurantController");

// ✅ Protected Admin Routes
router.get("/pending-restaurants", protect, adminOnly, getPendingRestaurants);

router.put("/approve-restaurant/:id", protect, adminOnly, approveRestaurant);

router.put("/reject-restaurant/:id", protect, adminOnly, rejectRestaurant);

module.exports = router;
