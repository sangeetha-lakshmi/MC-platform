const deliveryService = require("../modules/delivery/delivery.service");
const bcrypt = require("bcrypt");
const pool = require("../config/database"); // ✅ you forgot this
const { sendOTP } = require("../utils/twilio");
const { getIO } = require("../config/socket");

/* ================= REGISTER DELIVERY PARTNER ================= */
const registerDeliveryPartner = async (req, res) => {
  try {

    const result = await deliveryService.register(req.body);

    if (result?.resendOTP) {
      return res.status(200).json({
        message: result.message
      });
    }

    return res.status(201).json({
      message: result.message
    });

  } catch (err) {

    if (err.code === "23505") {
      return res.status(400).json({
        message: "Duplicate value detected"
      });
    }

    return res.status(400).json({
      message: err.message
    });
  }
};


/* ================= CHANGE PASSWORD ================= */
const changePassword = async (req, res) => {
  try {

    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        message: "New password required"
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE delivery_partners SET password_hash=$1 WHERE id=$2",
      [hashedPassword, req.params.id]
    );

    res.json({
      message: "Password Updated Successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: "Server Error"
    });
  }
};
const toggleActiveStatus = async (req, res) => {
  try {
    const deliveryId = req.user.id; // from JWT

    const result = await pool.query(
      `UPDATE delivery_partners
       SET is_active = NOT is_active
       WHERE id = $1
       RETURNING is_active`,
      [deliveryId]
    );

    res.json({
      message: "Status updated successfully",
      is_active: result.rows[0].is_active
    });

  } catch (error) {
    console.error("Toggle Active Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/* ================= STAGE 7 - GET AVAILABLE READY ORDERS ================= */

const getAvailableOrders = async (req, res) => {
  try {

    const orders = await deliveryService.getAvailableOrders();

    res.status(200).json({
      success: true,
      data: orders
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

/* ================= STAGE 8 - ACCEPT ORDER ================= */
const acceptOrder = async (req, res) => {
  try {

    const { orderId } = req.params; // 🔥 from URL
    const deliveryPartnerId = req.user.id;

    const updatedOrder =
      await deliveryService.acceptOrder(orderId, deliveryPartnerId);

    if (!updatedOrder) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    const io = getIO();

    io.to(`customer_${updatedOrder.customer_id}`).emit("orderUpdate", {
      status: "out_for_delivery",
      message: "Delivery partner is on the way to pickup your order"
    });

    res.json({
      success: true,
      message: "Order accepted successfully",
      data: updatedOrder
    });

  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};

/* ================= STAGE 9 - MARK ORDER COMPLETED ================= */
const markAsPicked = async (req, res) => {
  try {

    const { orderId } = req.params;
    const deliveryPartnerId = req.user.id;

    const updatedOrder =
      await deliveryService.markAsPicked(orderId, deliveryPartnerId);

    res.json({
      success: true,
      message: "Order picked successfully",
      data: updatedOrder
    });

  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};


const markAsDelivered = async (req, res) => {
  try {

    const { orderId } = req.params;
    const deliveryPartnerId = req.user.id;

    const updatedOrder =
      await deliveryService.markAsDelivered(orderId, deliveryPartnerId);

    res.json({
      success: true,
      message: "Order marked as completed",
      data: updatedOrder
    });

  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};


const getProfile = async (req, res) => {
  try {

    const deliveryId = req.user.id; // 🔥 from JWT

    const result = await pool.query(
      `SELECT id, name, email, phone,
              vehicle_type, vehicle_number,
              profile_id, is_approved,
              is_active, created_at
       FROM delivery_partners
       WHERE id = $1`,
      [deliveryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Delivery Partner Not Found"
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const updateProfile = async (req, res) => {
  try {

    const deliveryId = req.user.id; // 🔥 from JWT
    const { name, phone, vehicle_type, vehicle_number } = req.body;

    const result = await pool.query(
      `UPDATE delivery_partners
       SET name = $1,
           phone = $2,
           vehicle_type = $3,
           vehicle_number = $4
       WHERE id = $5
       RETURNING id, name, email, phone,
                 vehicle_type, vehicle_number,
                 profile_id, is_approved,
                 is_active, created_at`,
      [name, phone, vehicle_type, vehicle_number, deliveryId]
    );

    res.json({
      success: true,
      message: "Profile Updated Successfully",
      data: result.rows[0]
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  registerDeliveryPartner,
  changePassword,
  toggleActiveStatus,
  getAvailableOrders,
  acceptOrder,
  markAsPicked,
  markAsDelivered,
  getProfile,
  updateProfile
};
