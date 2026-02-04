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
    res.status(401).json({ error: err.message });
  }
};
