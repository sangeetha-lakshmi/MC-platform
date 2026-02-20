const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
 // console.log("🔥 AUTH MIDDLEWARE EXECUTED");
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token missing" });
    }

    const token = authHeader.split(" ")[1];

    // 🔍 DEBUG START (temporary)
    const decodedPreview = jwt.decode(token);
    console.log("Token Expiry:", new Date(decodedPreview.exp * 1000));
    console.log("Current Time:", new Date());
    // 🔍 DEBUG END

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      role: decoded.role || "user",
    };

    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
