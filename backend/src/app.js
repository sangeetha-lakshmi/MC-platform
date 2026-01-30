const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const adminRestaurantRoutes = require("./routes/adminRestaurantRoutes");
const restaurantAuthRoutes = require("./routes/restaurantAuthRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRestaurantRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
// ✅ Restaurant Register/Login Routes
app.use("/api/restaurants/auth", restaurantAuthRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Backend Running ✅");
});

module.exports = app;
