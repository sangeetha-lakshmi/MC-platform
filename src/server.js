require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 5000;


// Only listen locally, not on Vercel
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(` Backend running on port ${PORT}`);
  });
}

module.exports = app;

