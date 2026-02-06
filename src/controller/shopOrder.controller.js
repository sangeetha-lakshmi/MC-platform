const db = require("../config/database");

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
        o.ready_at,
        (o.ready_at IS NOT NULL AND o.ready_at <= NOW()) AS can_mark_ready,
        o.created_at
      FROM orders o
      WHERE o.status != 'handed'
      ORDER BY o.created_at ASC
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================================
   ACCEPT ORDER
   - prep time from PRODUCTS table
   - status → preparing
================================ */
const acceptOrder = async (req, res) => {
  const { id } = req.params;

  try {
    // 1️⃣ Get MAX preparing time from products via order_items
    //    (CASE + SPACE safe JOIN)
    const prepResult = await db.query(
      `
      SELECT MAX(p.preparing_minutes) AS prep_minutes
      FROM order_items oi
      JOIN products p
        ON LOWER(TRIM(p.name)) = LOWER(TRIM(oi.item_name))
      WHERE oi.order_id = $1
      `,
      [id]
    );

    if (!prepResult.rows[0] || !prepResult.rows[0].prep_minutes) {
      return res.status(400).json({
        message: "No items found for this order"
      });
    }

    const prepMinutes = prepResult.rows[0].prep_minutes;

    // 2️⃣ Update order → preparing + ready_at
    const updateResult = await db.query(
      `
      UPDATE orders
      SET
        status = 'preparing',
        ready_at = NOW() + ($2 || ' minutes')::INTERVAL
      WHERE id = $1 AND status = 'pending'
      `,
      [id, prepMinutes]
    );

    if (updateResult.rowCount === 0) {
      return res.status(400).json({
        message: "Order not in pending state"
      });
    }

    res.json({
      message: `Order accepted, preparing for ${prepMinutes} minutes`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* ================================
   READY BUTTON (manual)
================================ */
const markReady = async (req, res) => {
  const { id } = req.params;

  const result = await db.query(
    `
    UPDATE orders
    SET status = 'ready'
    WHERE id = $1
      AND status = 'preparing'
      AND ready_at <= NOW()
    `,
    [id]
  );

  if (result.rowCount === 0) {
    return res.status(400).json({
      message: "Order not ready yet or invalid state"
    });
  }

  res.json({ message: "Order marked as ready" });
};

/* ================================
   HAND OVER
================================ */
const handOver = async (req, res) => {
  const { id } = req.params;

  const result = await db.query(
    `
    UPDATE orders
    SET status = 'handed'
    WHERE id = $1 AND status = 'ready'
    `,
    [id]
  );

  if (result.rowCount === 0) {
    return res.status(400).json({ message: "Order not in ready state" });
  }

  res.json({ message: "Order handed over" });
};

/* ================================
   EXPORTS
================================ */
module.exports = {
  getOrders,
  acceptOrder,
  markReady,
  handOver
};
