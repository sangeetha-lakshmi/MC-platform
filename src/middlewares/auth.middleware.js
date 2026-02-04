const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ inject only what backend needs
    req.user = {
      id: decoded.id
    };

    next();
  } catch (err) {
    return res.sendStatus(401);
  }
};
