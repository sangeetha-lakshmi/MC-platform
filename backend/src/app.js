const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const vendorRoutes = require("./routes/vendor.routes");

const app = express();

app.use(cors());
app.use(express.json());

// health check
app.get("/api/health", (req, res) => {
  res.send("MC Platform Backend is running 🚀");
});

// routes
app.use("/api/auth", authRoutes);     // 🔑 single login here
app.use("/api/admin", adminRoutes);   // approval APIs
app.use("/api/vendor", vendorRoutes); // register vendor

// fallback 
app.use((req, res) => {
  res.status(404).json({ message: "Route not found ❌" });
});

module.exports = app;
