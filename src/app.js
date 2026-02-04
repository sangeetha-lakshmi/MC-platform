const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const vendorRoutes = require("./routes/vendor.routes");
const productRoutes = require("./routes/product.routes");

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Root route (useful for Vercel / browser check)
app.get("/", (req, res) => {
  res.send("MC Platform Backend is running 🚀");
});

// ✅ Health check
app.get("/api/health", (req, res) => {
  res.send("MC Platform Backend is healthy ✅");
});

// ✅ Routes
app.use("/api/auth", authRoutes);        // login (admin/vendor)
app.use("/api/admin", adminRoutes);      // admin actions
app.use("/api/vendor", vendorRoutes);    // vendor profile, vendor actions
app.use("/api/products", productRoutes); // product CRUD

// ❌ Fallback (MUST be last)
app.use((req, res) => {
  res.status(404).json({ message: "Route not found ❌" });
});

module.exports = app;
