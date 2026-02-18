const express = require("express");
const cors = require("cors");
const path = require("path");
const orderRoutes = require("./routes/shopOrder.routes");
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const vendorRoutes = require("./routes/vendor.routes");
const productRoutes = require("./routes/product.routes");
const deliveryRoutes = require("./routes/delivery.routes");
const adminDeliveryRoutes = require("./routes/adminDeliveryRoutes");
const commonCategoryRoutes = require("./routes/commonCategory.routes");
const customerRoutes = require("./routes/customer.routes");

const app = express();


app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://multistore-web-app.onrender.com/"
    ],
    methods: ["GET", "POST", "PUT","PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);
app.options("*", cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

/* SHOP ORDERS */
app.use("/api/shop", orderRoutes);


/* OTHER ROUTES */
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/otp", require("./routes/otp.routes"));
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/products", productRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/common", commonCategoryRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/admin/delivery_partners", adminDeliveryRoutes);


/* HEALTH */
app.get("/", (req, res) => {
  res.send("MC Platform Backend is running 🚀");
});

app.get("/api/health", (req, res) => {
  res.send("MC Platform Backend is healthy ✅");
});

/* 404 */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found ❌" });
});

module.exports = app;
