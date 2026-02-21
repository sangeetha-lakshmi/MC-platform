const { Server } = require("socket.io");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*" }
  });

  io.on("connection", (socket) => {
    console.log("Delivery Connected:", socket.id);

    socket.on("joinDeliveryRoom", (deliveryId) => {
      socket.join(`delivery_${deliveryId}`);
      console.log("Joined:", `delivery_${deliveryId}`);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.id);
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