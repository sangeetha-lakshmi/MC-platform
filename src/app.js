const express = require("express");
const cors = require("cors");
const path = require("path");
const orderRoutes = require("./routes/shopOrder.routes");
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const vendorRoutes = require("./routes/vendor.routes");
const productRoutes = require("./routes/product.routes");
const deliveryRoutes = require("./routes/delivery.routes");

const app = express();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://mc-frontend-xnet-hq8x54qxo-sowdha-begams-projects.vercel.app");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://mc-frontend-xnet-hq8x54qxo-sowdha-begams-projects.vercel.app"
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
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/products", productRoutes);
app.use("/api/delivery", deliveryRoutes);

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