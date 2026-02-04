const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const vendorRoutes = require("./routes/vendor.routes");
const productRoutes = require("./routes/product.routes");
const app = express();

app.use(cors());
app.use(express.json());

// ✅ root route (optional, but now works)
app.get("/", (req, res) => {
  res.send("Backend Working in Vercel ");
});

// health check
app.get("/api/health", (req, res) => {
  res.send("MC Platform Backend is running ");
});

// routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/products", productRoutes);
// ❌ fallback MUST be LAST
app.use((req, res) => {
  res.status(404).json({ message: "Route not found ❌" });
});

module.exports = app;

