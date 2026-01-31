require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 5000;

// Only listen locally
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} 🚀`);
  });
}

// Export for Vercel
module.exports = app;
