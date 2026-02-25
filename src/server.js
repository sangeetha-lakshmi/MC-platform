require("dotenv").config();

const http = require("http");
const app = require("./app");


const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// 🔥 Initialize socket here


if (process.env.NODE_ENV !== "production") {
  server.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
}