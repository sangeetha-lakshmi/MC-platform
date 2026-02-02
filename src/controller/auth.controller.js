const jwt = require("jsonwebtoken");
const authService = require("../modules/auth/auth.service");

exports.login = async (req, res) => {
  try {
    const user = await authService.login(req.body);

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful ✅",
      role: user.role,
      token
    });
  } catch (err) {
    res.status(401).json({ error: err });
  }
};
