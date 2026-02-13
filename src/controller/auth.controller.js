const jwt = require("jsonwebtoken");
const authService = require("../modules/auth/auth.service");
const pool = require("../config/database");



exports.login = async (req, res) => {


  try {
    const user = await authService.login(req.body);
console.log("User from DB:", user);
    // 🔐 JWT with ONLY id
    const token = jwt.sign(
  { 
    id: user.id,
    role: user.role   // 👈 IMPORTANT
  },
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);

  // 🔍 DEBUG START
    const decoded = jwt.decode(token);
    console.log("New Token Expiry:", new Date(decoded.exp * 1000));
    console.log("Current Time At Login:", new Date());
    // 🔍 DEBUG END

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
//Customer registration controller
exports.registerCustomer = async (req, res) => {
    const { name, email, phone, password } = req.body;

  if (!name || !password || (!email && !phone)) {
    return res.status(400).json({
      message: "Name, password and email or phone are required"
    });
  }
  try {
    await authService.registerCustomer(req.body);

    res.status(201).json({
      message: "Customer registered successfully"
    });
  } catch (err) {
    if (err.message === "Customer already exists") {
      return res.status(400).json({ message: err.message });
    }

    return res.status(500).json({ message: "Server error" });
  }
};

exports.updateCustomerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, password } = req.body;

    let query;
    let values;

    if (password) {
      const bcrypt = require("bcrypt");
      const hashedPassword = await bcrypt.hash(password, 10);

      query = `
        UPDATE app_data.customers
        SET name=$1, phone=$2, address=$3, password_hash=$4
        WHERE id=$5
        RETURNING id,name,phone,address,email
      `;
      values = [name, phone, address, hashedPassword, id];

    } else {
      query = `
        UPDATE app_data.customers
        SET name=$1, phone=$2, address=$3
        WHERE id=$4
        RETURNING id,name,phone,address,email
      `;
      values = [name, phone, address, id];
    }

    const result = await pool.query(query, values);

    res.json({
      message: "Profile updated successfully",
      user: result.rows[0]
    });

  } catch (err) {
     console.log("REAL LOGIN ERROR:", err); 
    console.log(err);
    res.status(500).json({ message: "Update failed" });
  }
};
