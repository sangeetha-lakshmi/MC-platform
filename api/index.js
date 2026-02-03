const express = require("express");

const authRoutes = require("../src/routes/auth.routes");
const adminRoutes = require("../src/routes/admin.routes");
const vendorRoutes = require("../src/routes/vendor.routes");

const app = express();

app.use(express.json());

// health check
app.get("/", (req, res) => {
  res.json({ message: "API working ✅" });
});

// routes
app.use("/login", authRoutes);
app.use("/admin", adminRoutes);
app.use("/vendor", vendorRoutes);

module.exports = app;
