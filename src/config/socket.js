const { Server } = require("socket.io");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*" }
  });

  io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    // 🔥 Delivery joins room
    socket.on("joinDeliveryRoom", (deliveryId) => {
      socket.join(`delivery_${deliveryId}`);
      console.log("Delivery Joined:", `delivery_${deliveryId}`);
    });

    // 🔥 Customer joins room
    socket.on("joinCustomerRoom", (customerId) => {
      socket.join(`customer_${customerId}`);
      console.log("Customer Joined:", `customer_${customerId}`);
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