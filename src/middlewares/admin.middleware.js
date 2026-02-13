

module.exports = (req, res, next) => {
  console.log("Decoded User:", req.user);   // 🔍 ADD THIS

  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied. Admin only."
    });
  }

  next();
};
