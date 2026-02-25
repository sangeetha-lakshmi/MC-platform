const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");
const vendorService = require("../modules/vendor/vendor.service");
const { sendOTP } = require("../utils/twilio");
const { getIO } = require("../config/socket");


function getStatusMessage(status) {
  switch (status) {
    case "accepted":
      return "Shop is preparing your order";
    case "ready":
      return "Order is ready for pickup";
    case "picked_up":
      return "Out for delivery";
    case "delivered":
      return "Delivered successfully";
    case "cancelled":
      return "Order has been cancelled";
    default:
      return "Processing your order";
  }
}
/* ================= REGISTER VENDOR ================= */

exports.registerVendor = async (req, res) => {
  try {
    const {
      shop_name,
      owner_name,
      email,
      phone,
      password,
      business_type,
      address,
      latitude,
      longitude,
      opening_time,
      closing_time,
      shop_logo,
      license_doc
    } = req.body;

    if (
      !shop_name ||
      !owner_name ||
      !email ||
      !phone ||
      !password ||
      !business_type
    ) {
      return res.status(400).json({
        error:
          "shop_name, owner_name, email, phone, password, business_type are required"
      });
    }

    

    // ✅ NEW: check duplicate email (SAFE FIX)
    const existingVendor = await vendorService.findVendorByEmail(email);
   if (existingVendor) {

  // If already verified → block
  if (existingVendor.phone_verified) {
    return res.status(409).json({
      message: "Email already registered"
    });
  }

  // If NOT verified → resend OTP
  // await sendOTP(phone);

  // return res.status(200).json({
  //   message: "Phone number not verified. OTP resent."
  // });
}


    const password_hash = await bcrypt.hash(password, 10);

    await vendorService.createVendor({
      shop_name,
      owner_name,
      email,
      phone,
      password_hash,
      business_type,
      address,
      latitude,
      longitude,
      opening_time,
      closing_time,
      shop_logo,
      license_doc
    });
await sendOTP(phone);
    res.status(201).json({
  message: "vendor Registration successful. Please wait for admin approval."
});
  } catch (err) {
    console.error("Register Vendor Error:", err);
    res.status(500).json({
      message: "Vendor registration failed"
    });
  }
};


/* ================= LOGIN VENDOR ================= */

exports.loginVendor = async (req, res) => {
  try {

    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    const vendor =
      await vendorService.findVendorByEmailOrPhone(identifier);

    if (!vendor) {
      return res.status(404).json({
        error: "Vendor not found"
      });
    }

    if (vendor.is_approved === "declined") {
      return res.status(403).json({
        error:
          "Your account has been declined by admin"
      });
    }

    if (vendor.is_approved === "pending") {
      return res.status(403).json({
        error: "Admin approval pending"
      });
    }

    const match =
      await bcrypt.compare(password, vendor.password_hash);

    if (!match) {
      return res.status(401).json({
        error: "Invalid password"
      });
    }

    const token = jwt.sign(
      { id: vendor.id, role: "vendor" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Vendor login successful",
      token
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};


/* ================= GET VENDOR PROFILE ================= */

exports.getVendorProfile = async (req, res) => {
  try {

    const vendorId = req.user.id;

    const result = await pool.query(
      `SELECT
        id,
        shop_name,
        owner_name,
        email,
        phone,
        business_type,
        address,
        opening_time,
        closing_time,
        latitude,
        longitude,
        shop_logo,
        license_doc,
        created_at
       FROM vendors
       WHERE id = $1`,
      [vendorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Vendor not found"
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error(
      "Get Vendor Profile Error:",
      error.message
    );
    res.status(500).json({
      message: "Server error"
    });
  }
};


/* ================= UPDATE VENDOR PROFILE ================= */

/* ================= UPDATE VENDOR PROFILE ================= */

exports.updateVendorProfile = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { phone, ...otherFields } = req.body;

    // 1️⃣ Get current phone
    const result = await pool.query(
      "SELECT phone FROM vendors WHERE id = $1",
      [vendorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Vendor not found"
      });
    }

    const currentPhone = result.rows[0].phone;

    // 2️⃣ If phone changed → send OTP
    if (phone && phone !== currentPhone) {

      // Save new phone in pending_phone
      await pool.query(
        "UPDATE vendors SET pending_phone = $1 WHERE id = $2",
        [phone, vendorId]
      );

      // Send OTP (same function used in registration)
      await sendOTP(phone);

      return res.json({
        message: "Vendor registration was successful. please wait for admin approval"
      });
    }

    // 3️⃣ If phone not changed → update other fields normally

    await pool.query(
      `UPDATE vendors
       SET shop_name = COALESCE($1, shop_name),
           owner_name = COALESCE($2, owner_name),
           email = COALESCE($3, email),
           business_type = COALESCE($4, business_type),
           address = COALESCE($5, address),
           opening_time = COALESCE($6, opening_time),
           closing_time = COALESCE($7, closing_time),
           latitude = COALESCE($8, latitude),
           longitude = COALESCE($9, longitude),
           shop_logo = COALESCE($10, shop_logo),
           license_doc = COALESCE($11, license_doc)
       WHERE id = $12`,
      [
        otherFields.shop_name,
        otherFields.owner_name,
        otherFields.email,
        otherFields.business_type,
        otherFields.address,
        otherFields.opening_time,
        otherFields.closing_time,
        otherFields.latitude,
        otherFields.longitude,
        otherFields.shop_logo,
        otherFields.license_doc,
        vendorId
      ]
    );

    res.json({
      message: "Profile updated successfully"
    });

  } catch (err) {
    console.error("Update Vendor Error:", err);
    res.status(500).json({
      message: "Profile update failed"
    });
  }
};
/* ================= TOGGLE SHOP ONLINE/OFFLINE ================= */

exports.toggleShopStatus = async (req, res) => {
  try {

    const userId = req.user.id;

    const vendorCheck = await pool.query(
      "SELECT id, is_online FROM vendors WHERE id = $1",
      [userId]
    );

    if (vendorCheck.rowCount === 0) {
      return res.status(403).json({
        message: "Vendor not found"
      });
    }

    const { is_online } = req.body;

    if (typeof is_online !== "boolean") {
      return res.status(400).json({
        message: "Invalid toggle value"
      });
    }

    await pool.query(
      "UPDATE vendors SET is_online = $1 WHERE id = $2",
      [is_online, userId]
    );

    res.json({
      success: true,
      message: is_online
        ? "You are back online"
        : "You are now offline. No new orders will come."
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error"
    });
  }
};


/* ================= 🔥 STAGE 3 — GET INCOMING ORDERS ================= */

exports.getIncomingOrders = async (req, res) => {
  try {

    const vendorId = req.user.id;

    const orders =
      await vendorService.getVendorOrders(vendorId);

    res.status(200).json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error("VENDOR ORDERS ERROR 👉", error);
    res.status(500).json({
      message: "Unable to fetch vendor orders"
    });
  }
};


/* ================= UPDATE ORDER STATUS ================= */

exports.updateOrderStatus = async (req, res) => {
  try {

    const vendorId = req.user.id;
const { id, status } = req.params;
const order_id = id;   // keep your existing variable usage

    // ✅ 1️⃣ Basic validation
    if (!order_id || !status) {
      return res.status(400).json({
        message: "order_id and status required"
      });
    }

    // 🔥 2️⃣ STATUS VALIDATION (ADD HERE)
    const allowedStatuses = [
      "accepted",
      "ready",
      "picked_up",
      "delivered",
      "cancelled"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status value"
      });
    }

    // ✅ 3️⃣ Now safe to update DB
    const updatedOrder =
      await vendorService.updateOrderStatus(
        order_id,
        status,
        vendorId
      );
    // ✅ 2️⃣ Get customer ID for realtime update
    const orderRes = await pool.query(
      "SELECT customer_id FROM orders WHERE id = $1",
      [order_id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    const customerId = orderRes.rows[0].customer_id;

    // ✅ 3️⃣ Get socket instance
    const io = getIO();

    // ✅ 4️⃣ Status-based message
   const message = getStatusMessage(status);

    // ✅ 5️⃣ Send realtime update to customer
    io.to(`customer_${customerId}`).emit("orderStatusUpdate", {
      orderId: order_id,
      status,
      message,
      updatedAt: new Date()
    });

    // ✅ 6️⃣ API Response
    res.json({
      success: true,
      message: "Order status updated",
      data: updatedOrder
    });

  } catch (error) {

    console.error("UPDATE ORDER STATUS ERROR 👉", error);

    res.status(500).json({
      message: error.message
    });
  }
};
//for deployment testing