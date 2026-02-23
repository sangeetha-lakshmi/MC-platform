require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");

const PORT = process.env.PORT || 5000;

// 🔥 Create HTTP server from Express app
const server = http.createServer(app);

// 🔥 Attach Socket.IO
const io = new Server(server, {
  cors: { origin: "*" }
});

// 🔥 Make io available in controllers
app.set("io", io);

// ================= SOCKET CONNECTION =================

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Customer joins room
  socket.on("joinCustomerRoom", (customerId) => {
    socket.join(`customer_${customerId}`);
  });

  // Vendor joins room
  socket.on("joinVendorRoom", (vendorId) => {
    socket.join(`vendor_${vendorId}`);
  });

  // Delivery joins room
  socket.on("joinDeliveryRoom", (deliveryId) => {
    socket.join(`delivery_${deliveryId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Only listen locally, not on Vercel
if (process.env.NODE_ENV !== "production") {
  server.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
}

module.exports = app;