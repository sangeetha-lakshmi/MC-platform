const db = require("../config/database");

/* GET all orders – SHOP DASHBOARD */
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
      WHERE status != 'handed'
      ORDER BY created_at ASC
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ACCEPT */
const acceptOrder = async (req, res) => {
  const { id } = req.params;

  const result = await db.query(
    "UPDATE orders SET status='accepted' WHERE id=$1 AND status='pending'",
    [id]
  );

  if (result.rowCount === 0) {
    return res.status(400).json({ message: "Order not in pending state" });
  }

  res.json({ message: "Order accepted" });
};

/* PREPARING */
const startPreparing = async (req, res) => {
  const { id } = req.params;

  const result = await db.query(
    "UPDATE orders SET status='preparing' WHERE id=$1 AND status='accepted'",
    [id]
  );

  if (result.rowCount === 0) {
    return res.status(400).json({ message: "Order not in accepted state" });
  }

  res.json({ message: "Order is preparing" });
};

/* READY */
const markReady = async (req, res) => {
  const { id } = req.params;

  const result = await db.query(
    "UPDATE orders SET status='ready' WHERE id=$1 AND status='preparing'",
    [id]
  );

  if (result.rowCount === 0) {
    return res.status(400).json({ message: "Order not in preparing state" });
  }

  res.json({ message: "Order ready" });
};

/* HAND OVER */
const handOver = async (req, res) => {
  const { id } = req.params;

  const result = await db.query(
    "UPDATE orders SET status='handed' WHERE id=$1 AND status='ready'",
    [id]
  );

  if (result.rowCount === 0) {
    return res.status(400).json({ message: "Order not in ready state" });
  }

  res.json({ message: "Order handed over" });
};

/* EXPORTS (IMPORTANT) */
module.exports = {
  getOrders,
  acceptOrder,
  startPreparing,
  markReady,
  handOver
};
