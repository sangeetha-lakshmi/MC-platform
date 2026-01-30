const express = require("express");
const router = express.Router();

const {
  registerRestaurant,
  loginRestaurant,
} = require("../controllers/restaurantAuthController");

// ✅ Register
router.post("/register", registerRestaurant);

// ✅ Login
router.post("/login", loginRestaurant);

module.exports = router;
