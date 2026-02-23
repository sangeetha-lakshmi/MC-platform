const { Server } = require("socket.io");
let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*" }
  });

  io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    // Customer room
    socket.on("joinCustomerRoom", (customerId) => {
      socket.join(`customer_${customerId}`);
      console.log("Customer Joined:", `customer_${customerId}`);
    });

    // Vendor room
    socket.on("joinVendorRoom", (vendorId) => {
      socket.join(`vendor_${vendorId}`);
      console.log("Vendor Joined:", `vendor_${vendorId}`);
    });

    // Delivery personal room
    socket.on("joinDeliveryRoom", (deliveryId) => {
      socket.join(`delivery_${deliveryId}`);
      console.log("Delivery Joined:", `delivery_${deliveryId}`);
    });

    // Delivery global room
    socket.on("joinDeliveryGlobal", () => {
      socket.join("delivery_global");
      console.log("Delivery joined global room");
    });

    socket.on("disconnect", () => {
      console.log("User Disconnected:", socket.id);
    });
  });
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket not initialized");
  }
  return io;
};

module.exports = { initSocket, getIO };