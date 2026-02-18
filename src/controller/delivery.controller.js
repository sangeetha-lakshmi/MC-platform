const deliveryService = require("../modules/delivery/delivery.service");
const bcrypt = require("bcrypt");
const pool = require("../config/database");


/* ================= REGISTER DELIVERY PARTNER ================= */
const registerDeliveryPartner = async (req, res) => {
  try {

    await deliveryService.register(req.body);

    res.status(201).json({
      message:
        "Delivery partner registered successfully. Await admin approval."
    });

  } catch (err) {

    if (err.code === "23505") {
      return res.status(400).json({
        message:
          "Duplicate value detected (Email / Phone / License / Aadhar / PAN)"
      });
    }

    res.status(400).json({
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
      message: "Unable to fetch available orders"
    });
  }
};


/* ================= STAGE 8 - ACCEPT ORDER ================= */
const acceptOrder = async (req, res) => {
  try {

    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({
        message: "order_id is required"
      });
    }

    const deliveryPartnerId = req.user.id;

    const updatedOrder =
      await deliveryService.acceptOrder(order_id, deliveryPartnerId);

    if (!updatedOrder) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    res.json({
      success: true,
      message: "Order accepted successfully",
      data: updatedOrder
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


/* ================= STAGE 9 - MARK ORDER COMPLETED ================= */
const markAsDelivered = async (req, res) => {
  try {

    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({
        message: "order_id is required"
      });
    }

    const deliveryPartnerId = req.user.id;

    const updatedOrder =
      await deliveryService.markAsDelivered(order_id, deliveryPartnerId);

    if (!updatedOrder) {
      return res.status(404).json({
        message: "Order not found or not assigned to you"
      });
    }

    res.json({
      success: true,
      message: "Order marked as completed",
      data: updatedOrder
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
  getAvailableOrders,
  acceptOrder,
  markAsDelivered   // 🔥 ADDED
};
