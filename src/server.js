require("dotenv").config();
const http = require("http");
const app = require("./app");
const { initSocket } = require("./config/socket");

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket
initSocket(server);

// Only run locally (not on Vercel)
if (process.env.NODE_ENV !== "production") {
  server.listen(PORT, () => {
    console.log(`Backend + Socket running on port ${PORT}`);
  });
}

module.exports = server;
