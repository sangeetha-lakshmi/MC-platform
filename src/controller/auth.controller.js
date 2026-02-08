const jwt = require("jsonwebtoken");
const authService = require("../modules/auth/auth.service");

exports.login = async (req, res) => {
  try {
    const user = await authService.login(req.body);

    // 🔐 JWT with ONLY id
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token
    });
 } catch (err) {
  if (err.message === "User not found") {
    return res.status(404).json({ message: "Account not found" });
  }

  if (err.message === "Invalid password") {
    return res.status(401).json({ message: "Incorrect password" });
  }

  if (err.message === "Admin approval pending") {
    return res.status(403).json({ message: "Admin approval pending" });
  }

  return res.status(500).json({ message: "Server error" });
}

};
