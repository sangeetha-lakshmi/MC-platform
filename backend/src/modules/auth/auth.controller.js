const jwt = require("jsonwebtoken");
const authService = require("./auth.service");

exports.vendorLogin = async (req, res) => {
  const vendor = await authService.vendorLogin(req.body);

  const token = jwt.sign(
    { id: vendor.id, role: "vendor" },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({ token });
};
