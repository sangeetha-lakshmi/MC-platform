const db = require("../config/database");
const { getIO } = require("../config/socket");  // add top
/* ================================
   GET ORDERS – SHOP DASHBOARD
================================ */
const getOrders = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        o.id,
        o.order_code,
        o.customer_name,
        o.total_amount,
        o.status,
        o.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'name', oi.item_name,
              'qty', oi.quantity
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at ASC
    `);

    res.json(result.rows);
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
