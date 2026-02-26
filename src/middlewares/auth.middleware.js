const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ✅ Check header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authorization token missing"
      });
    }

    const token = authHeader.split(" ")[1];

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Attach user to request
    req.user = {
      id: decoded.id,
      role: decoded.role || "user",
    };

    next();

  } catch (err) {
    console.error("❌ Token verification failed:", err.message);

    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};