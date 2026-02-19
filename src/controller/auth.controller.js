const jwt = require("jsonwebtoken");
const authService = require("../modules/auth/auth.service");
const transporter = require("../config/email");
const { sendOTP, verifyOTP: verifyTwilioOTP } = require("../utils/twilio");
const { hashPassword } = require("../utils/password.utils");
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

   const result = await authService.registerCustomer(req.body);

// 🔥 If resend required
if (result?.resendOTP) {
  await sendOTP(phone);

  return res.status(200).json({
    message: "Phone already registered but not verified. OTP resent."
  });
}


    // If email only
    res.status(201).json({
      message: "Customer registered successfully"
    });

  } catch (err) {

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

const crypto = require("crypto");

exports.forgotPassword = async (req, res) => {
  const { email, phone } = req.body;

  try {
    if (!email && !phone) {
      return res.status(400).json({
        message: "Email or phone is required"
      });
    }

    const tables = [
      "vendors",
      "app_data.customers",
      "delivery_partners"
    ];

    let tableFound = null;

    /* ================= IDENTIFY USER TABLE ================= */
    for (let table of tables) {
      const result = await pool.query(
        email
          ? `SELECT id FROM ${table} WHERE email=$1`
          : `SELECT id FROM ${table} WHERE phone=$1`,
        [email || phone]
      );

      if (result.rowCount > 0) {
        tableFound = table;
        break;
      }
    }

    if (!tableFound) {
      return res.status(404).json({ message: "Account not found" });
    }

    /* ================= EMAIL FLOW ================= */
    if (email) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      await pool.query(
        `UPDATE ${tableFound}
         SET reset_token=$1,
             reset_token_expiry=$2
         WHERE email=$3`,
        [token, expiry, email]
      );

      const resetLink = `http://localhost:3000/reset-password?token=${token}`;

      await transporter.sendMail({
        to: email,
        subject: "Reset Your Password",
        html: `
          <h3>Password Reset</h3>
          <p>This link is valid for 15 minutes.</p>
          <a href="${resetLink}">Click here to reset password</a>
        `
      });

      return res.json({
        message: "Reset link sent to registered email"
      });
    }

    /* ================= PHONE FLOW ================= */
    if (phone) {
      await sendOTP(phone);

      return res.json({
        message: "OTP sent to registered phone number"
      });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};


exports.verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;

  try {
    const response = await verifyTwilioOTP(phone, otp);

    if (response.status !== "approved") {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const tables = [
      "vendors",
      "app_data.customers",
      "delivery_partners"
    ];

    let updated = false;

    for (let table of tables) {
      const result = await pool.query(
        `UPDATE ${table}
         SET phone_verified=true
         WHERE phone=$1
         RETURNING id`,
        [phone]
      );

      if (result.rowCount > 0) {
        updated = true;
        break;
      }
    }

    if (!updated) {
      return res.status(404).json({
        message: "Account not found"
      });
    }

    return res.json({
      message: "OTP verified successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};


exports.resetPassword = async (req, res) => {
  const { token, phone, password, confirmPassword } = req.body;

  try {
    if (!password || !confirmPassword)
      return res.status(400).json({ message: "Password required" });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    const tables = [
      "vendors",
      "app_data.customers",
      "delivery_partners"
    ];

    let tableFound = null;

    /* ================= EMAIL TOKEN RESET ================= */
    if (token) {
      for (let table of tables) {
        const result = await pool.query(
          `SELECT id FROM ${table}
           WHERE reset_token=$1
           AND reset_token_expiry > NOW()`,
          [token]
        );

        if (result.rowCount > 0) {
          tableFound = table;
          break;
        }
      }

      if (!tableFound) {
        return res.status(400).json({
          message: "Invalid or expired reset link"
        });
      }

      const hashedPassword = await hashPassword(password);

      await pool.query(
        `UPDATE ${tableFound}
         SET password_hash=$1,
             reset_token=NULL,
             reset_token_expiry=NULL
         WHERE reset_token=$2`,
        [hashedPassword, token]
      );

      return res.json({
        message: "Password reset successful"
      });
    }

    /* ================= PHONE OTP RESET ================= */
    if (phone) {
      for (let table of tables) {
        const result = await pool.query(
          `SELECT id FROM ${table}
           WHERE phone=$1 AND phone_verified=true`,
          [phone]
        );

        if (result.rowCount > 0) {
          tableFound = table;
          break;
        }
      }

      if (!tableFound) {
        return res.status(400).json({
          message: "Phone not verified or account not found"
        });
      }

      const hashedPassword = await hashPassword(password);

      await pool.query(
        `UPDATE ${tableFound}
         SET password_hash=$1
         WHERE phone=$2`,
        [hashedPassword, phone]
      );

      return res.json({
        message: "Password reset successful"
      });
    }

    return res.status(400).json({
      message: "Token or phone required"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.verifyResetToken = async (req, res) => {
  const { token } = req.params;

  try {
    const tables = ["vendors", "app_data.customers", "delivery_partners"];

    let tableFound = null;

    for (let table of tables) {
      const result = await pool.query(
        `SELECT id FROM ${table}
         WHERE reset_token=$1
         AND reset_token_expiry > NOW()`,
        [token]
      );

      if (result.rowCount > 0) {
        tableFound = table;
        break;
      }
    }

    if (!tableFound) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // 🔥 Mark reset_verified = true
    await pool.query(
      `UPDATE ${tableFound}
       SET reset_verified=true
       WHERE reset_token=$1`,
      [token]
    );

    return res.json({
      message: "Token verified successfully. You can now reset password."
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
