const express = require("express");
const cors = require("cors");
const path = require("path");
const orderRoutes = require("./routes/shopOrder.routes");
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const vendorRoutes = require("./routes/vendor.routes");
const productRoutes = require("./routes/product.routes");

const app = express();
app.use("/uploads", express.static("uploads"));
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://mc-platform-gpsuzkr-sangeetha-lakshmis-projects.vercel.app"
    ],
    methods: ["GET", "POST", "PUT","PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);
app.options("*", cors());
app.use(express.json());

/* SHOP ORDERS */
app.use("/api/shop", orderRoutes);

/* HEALTH */
app.get("/", (req, res) => {
  res.send("MC Platform Backend is running 🚀");
});

app.get("/api/health", (req, res) => {
  res.send("MC Platform Backend is healthy ✅");
});

/* OTHER ROUTES */
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/products", productRoutes);

/* 404 */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found ❌" });
});

module.exports = app;
