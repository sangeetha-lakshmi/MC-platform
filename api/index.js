
const express = require("express");

const authRoutes = require("../src/routes/auth.routes");
const adminRoutes = require("../src/routes/admin.routes");
const vendorRoutes = require("../src/routes/vendor.routes");

const app = express();

app.use(express.json());

// ✅ health / base check
app.get("/", (req, res) => {
  res.json({ message: "API working ✅" });
});

// ✅ ROUTE WIRING (THIS WAS MISSING)
app.use("/login", authRoutes);
app.use("/admin", adminRoutes);
app.use("/vendor", vendorRoutes);

// ❌ always LAST
app.use((req, res) => {
  res.status(404).json({ message: "Route not found ❌" });
});

module.exports = app;
