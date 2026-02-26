const db = require("../config/database");
const { getIO } = require("../config/socket");

/* ================================
   GET ORDERS – SHOP DASHBOARD
================================ */
const getOrders = async (req, res) => {
  try {
    const shopId = req.user.id;

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
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [shopId]);

    res.json({ success: true, data: result.rows });

  } catch (err) {
    console.error("Get Orders Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/* ================================
   FIND NEAREST AGENTS
================================ */
const findNearestAgents = async (shopLat, shopLng) => {

  const result = await db.query(`
    SELECT
      id,
      latitude,
      longitude,

      6371 * acos(
        cos(radians($1)) *
        cos(radians(latitude)) *
        cos(radians(longitude) - radians($2)) +
        sin(radians($1)) *
        sin(radians(latitude))
      ) AS distance

    FROM delivery_partners
    ORDER BY distance ASC
    LIMIT 5
  `, [shopLat, shopLng]);

  return result.rows;
};
/* ================================
   ASSIGN AGENT SEQUENTIALLY
================================ */
const assignToNextAgent = async (orderId, agents, index = 0) => {

  if (index >= agents.length) {
    console.log("❌ No agents accepted");
    return;
  }

  const agent = agents[index];
  const io = getIO();

  console.log("Trying agent:", agent.id);

  io.to(`delivery_${agent.id}`)
    .emit("delivery_request", { orderId });

  setTimeout(async () => {
  const check = await db.query(
    "SELECT delivery_partner_id FROM orders WHERE id = $1",
    [orderId]
  );

  if (!check.rows[0].delivery_partner_id) {
    console.log("No response → next agent");
    assignToNextAgent(orderId, agents, index + 1);
  }

}, 300000); // ✅ 5 minutes
};

/* ================================
   ACCEPT ORDER
================================ */
const acceptOrder = async (req, res) => {
  const { id } = req.params;

  try {

    // ✅ Update only pending orders
    const result = await db.query(`
      UPDATE orders
      SET status = 'accepted'
      WHERE id = $1 AND status = 'pending'
      RETURNING *
    `, [id]);

    if (result.rowCount === 0) {
      return res.status(400).json({
        message: "Order not in pending state"
      });
    }

    const order = result.rows[0];

    // ✅ Security: Check order belongs to this shop
    if (order.vendor_id !== req.user.id) {
      return res.status(403).json({ error: "Not your order" });
    }

    const io = getIO();

    /* ⭐ Notify CUSTOMER */
    io.to(`customer_${order.customer_id}`)
      .emit("order_update", {
        order_id: order.id,
        status: "preparing"
      });

    /* ⭐ GET SHOP LOCATION FROM SHOPS TABLE */
    const shopResult = await db.query(
      `SELECT latitude, longitude
       FROM Vendors
       WHERE id = $1`,
      [order.vendor_id]
    );

    if (shopResult.rowCount === 0) {
      return res.status(404).json({
        error: "Shop not found"
      });
    }

    const shopLat = shopResult.rows[0].latitude;
    const shopLng = shopResult.rows[0].longitude;

    if (!shopLat || !shopLng) {
      return res.status(400).json({
        error: "Shop location missing"
      });
    }

    /* ⭐ FIND NEAREST AGENTS */
    const agents = await findNearestAgents(shopLat, shopLng);

    console.log("Nearest agents:", agents);

    /* ⭐ START AGENT ASSIGNMENT */
    assignToNextAgent(order.id, agents);

    res.json({ status: "preparing" });

  } catch (err) {
  console.error("Accept Order Error FULL:", err);
  res.status(500).json({
    error: err.message,
    stack: err.stack
  });
}
};

/* ================================
   READY
================================ */
const markReady = async (req, res) => {
  const { id } = req.params;

  try {

    const result = await db.query(`
      UPDATE orders
      SET status = 'ready'
      WHERE id = $1
        AND status = 'assigned'
        AND delivery_partner_id IS NOT NULL
      RETURNING *
    `, [id]);

    if (result.rowCount === 0) {
      return res.status(400).json({
        message: "Order not ready OR agent not assigned"
      });
    }

    const order = result.rows[0];
    const io = getIO();

    io.to(`delivery_${order.delivery_partner_id}`)
      .emit("order_ready_for_pickup", {
        order_id: order.id
      });

    io.to(`customer_${order.customer_id}`)
      .emit("order_update", {
        order_id: order.id,
        status: "ready"
      });

    res.json({ status: "ready" });

  } catch (err) {
    console.error("Mark Ready Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/* ================================
   COMPLETED
================================ */
const completeOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(`
      UPDATE orders
      SET status = 'completed'
      WHERE id = $1 AND status = 'ready'
      RETURNING *
    `, [id]);

    if (result.rowCount === 0) {
      return res.status(400).json({
        message: "Order not in ready state"
      });
    }

    res.json({ status: "completed" });

  } catch (err) {
    console.error("Complete Order Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getOrders,
  acceptOrder,
  markReady,
  completeOrder
};