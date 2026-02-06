const db = require("../config/database");

/* ================================
   GET ORDERS – SHOP DASHBOARD
   (hide completed)
================================ */
const getOrders = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        id,
        order_code,
        customer_name,
        total_amount,
        status,
        created_at
      FROM orders
      ORDER BY created_at ASC
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* ================================
   ACCEPT ORDER
   → notification only
   → DB unchanged
================================ */
const acceptOrder = async (req, res) => {
  const { id } = req.params;

  try {
    // optional: check order exists
    const check = await db.query(
      "SELECT id FROM orders WHERE id = $1 AND status = 'pending'",
      [id]
    );

    if (check.rowCount === 0) {
      return res.status(400).json({
        message: "Order not in pending state"
      });
    }

    res.json({
      status: "preparing",
      customer_message: "Your order is preparing 🍳"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================================
   READY
   pending → ready
================================ */
const markReady = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `
      UPDATE orders
      SET status = 'ready'
      WHERE id = $1 AND status = 'pending'
      RETURNING *
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({
        message: "Order already ready or completed"
      });
    }

    res.json({
      status: "ready",
      customer_message: "Your order is ready ✅",
      order: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================================
   COMPLETED
   ready → completed
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

    res.json({
      status: "completed",
      customer_message: "Order completed 🎉",
      order: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================================
   EXPORTS
================================ */
module.exports = {
  getOrders,
  acceptOrder,
  markReady,
  completeOrder
};
