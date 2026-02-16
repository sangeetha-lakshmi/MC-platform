const jwt = require("jsonwebtoken");
const authService = require("../modules/auth/auth.service");
const pool = require("../config/database");

exports.login = async (req, res) => {
  try {
    const user = await authService.login(req.body);



    // 🔐 Create JWT
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const decoded = jwt.decode(token);
    console.log("Token Expiry:", new Date(decoded.exp * 1000));

    res.status(200).json({
      message: "Login successful",
      token
    });

  } catch (err) {

    console.log("LOGIN ERROR:", err.message);

    // ✅ Proper Error Handling

    if (err.message === "User not found") {
      return res.status(404).json({ message: "Account not found" });
    }

    if (err.message === "Invalid password") {
      return res.status(401).json({ message: "Incorrect password" });
    }

    if (err.message === "Admin approval pending") {
      return res.status(403).json({ message: "Admin approval pending" });
    }

    if (err.message === "Account is inactive") {
      return res.status(403).json({ message: "Account is inactive" });
    }

    if (err.message === "Password not set by admin yet") {
      return res.status(403).json({ message: "Password not set by admin yet" });
    }

    // 🔥 Show real error instead of generic
    return res.status(500).json({ message: err.message });
  }
};


/* ================= CUSTOMER REGISTER ================= */

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

    console.log("REGISTER ERROR:", err.message);

    if (err.message === "Customer already exists") {
      return res.status(400).json({ message: err.message });
    }

    return res.status(500).json({ message: err.message });
  }
};


/* ================= CUSTOMER UPDATE ================= */

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

    console.log("UPDATE ERROR:", err.message);

    res.status(500).json({ message: err.message });
  }
};
