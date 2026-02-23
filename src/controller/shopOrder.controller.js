const db = require("../config/database");
const { getIO } = require("../config/socket");  // add top
/* ================================
   GET ORDERS – SHOP DASHBOARD
================================ */
const getOrders = async (req, res) => {
  try {
    const vendorId = req.user.id; // ⭐ Logged-in shop ID

    const result = await db.query(`
  SELECT
    o.id,
    o.order_code,
    o.customer_name,
    o.total_amount,
    o.status,
    o.created_at,
    o.ready_at,
    o.updated_at,
    o.delivery_partner_id,
    o.customer_id,
    o.vendor_id,

    COALESCE(
      json_agg(
        json_build_object(
          'item_id', oi.id,
          'name', oi.item_name,
          'qty', oi.quantity,
          'price', oi.price
        )
      ) FILTER (WHERE oi.id IS NOT NULL),
      '[]'
    ) AS items

  FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id

  WHERE o.vendor_id = $1

  GROUP BY
    o.id,
    o.order_code,
    o.customer_name,
    o.total_amount,
    o.status,
    o.created_at,
    o.ready_at,
    o.updated_at,
    o.delivery_partner_id,
    o.customer_id,
    o.vendor_id

  ORDER BY o.created_at DESC
`, [vendorId]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* ================================
   ACCEPT ORDER
================================ */
const acceptOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const check = await db.query(
      "SELECT id FROM orders WHERE id = $1 AND status = 'pending'",
      [id]
    );

    if (check.rowCount === 0) {
      return res.status(400).json({
        message: "Order not in pending state"
      });
    }

    // Optional: update to preparing
    await db.query(
      "UPDATE orders SET status = 'preparing' WHERE id = $1",
      [id]
    );

    res.json({ status: "preparing" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================================
   READY
================================ */
const markReady = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `
      UPDATE orders
      SET status = 'ready'
      WHERE id = $1 AND status = 'preparing'
      RETURNING *
      `,
      [id]
    );

    const io = getIO();

io.to("delivery_global").emit("newOrderAvailable", {
  order_id: updatedOrder.id,
  shop_name: updatedOrder.shop_name,
  address: updatedOrder.address,
  latitude: updatedOrder.latitude,
  longitude: updatedOrder.longitude
});

    if (result.rowCount === 0) {
      return res.status(400).json({
        message: "Order not in preparing state"
      });
    }

    res.json({ status: "ready" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================================
   COMPLETED
================================ */
const completeOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `
      UPDATE orders
      SET status = 'completed'
      WHERE id = $1 AND status = 'ready'
      RETURNING *
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({
        message: "Order not in ready state"
      });
    }

    res.json({ status: "completed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getOrders,
  acceptOrder,
  markReady,
  completeOrder
};
