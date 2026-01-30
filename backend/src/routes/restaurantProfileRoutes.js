const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const {
  updateRestaurantProfile,
} = require("../controllers/restaurantProfileController");

router.put("/update-profile", protect, updateRestaurantProfile);

module.exports = router;
