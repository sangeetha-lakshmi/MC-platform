const { Server } = require("socket.io");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"]
    }
  });

  io.on("connection", (socket) => {
    console.log("🔌 User Connected:", socket.id);

    /* =========================
       👤 CUSTOMER ROOM
    ========================= */
    socket.on("joinCustomerRoom", (customerId) => {
      if (!customerId) return;

      const room = `customer_${customerId}`;
      socket.join(room);

      console.log("👤 Customer Joined:", room);
    });

    /* =========================
       🏪 VENDOR ROOM
    ========================= */
    socket.on("joinVendorRoom", (vendorId) => {
      if (!vendorId) return;

      const room = `vendor_${vendorId}`;
      socket.join(room);

      console.log("🏪 Vendor Joined:", room);
    });

    /* =========================
       🚴 DELIVERY PERSON ROOM
    ========================= */
    socket.on("joinDeliveryRoom", (deliveryId) => {
      if (!deliveryId) return;

      const room = `delivery_${deliveryId}`;
      socket.join(room);

      // ⭐ Add to available agents pool
      socket.join("available_agents");

      console.log("🚴 Delivery Joined:", room);
      console.log("🟢 Added to available_agents");
    });

    /* =========================
       📴 WHEN AGENT BECOMES BUSY
    ========================= */
    socket.on("deliveryBusy", () => {
      socket.leave("available_agents");
      console.log("🔴 Delivery removed from available_agents");
    });

    /* =========================
       🟢 WHEN AGENT BECOMES FREE
    ========================= */
    socket.on("deliveryAvailable", () => {
      socket.join("available_agents");
      console.log("🟢 Delivery added back to available_agents");
    });

    /* =========================
       ❌ DISCONNECT
    ========================= */
    socket.on("disconnect", () => {
      console.log("❌ User Disconnected:", socket.id);
    });
  });
};

/* =========================
   GET SOCKET INSTANCE
========================= */
const getIO = () => {
  if (!io) {
    throw new Error("❌ Socket not initialized");
  }
  return io;
};

module.exports = { initSocket, getIO };