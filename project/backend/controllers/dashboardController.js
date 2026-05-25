const db = require('../config/db');
const { success } = require('../utils/responseHandler');

const getDashboardSummary = (req, res, next) => {
  try {
    // Total orders
    const totalOrders = db.get('SELECT COUNT(*) as count FROM orders')?.count || 0;

    // Revenue (from paid or all bills)
    const revenue = db.get('SELECT COALESCE(SUM(amount), 0) as total FROM bills WHERE paymentStatus = ?', ['paid'])?.total || 0;

    // Active tables (occupied)
    const activeTables = db.get("SELECT COUNT(*) as count FROM tables_info WHERE status = 'occupied'")?.count || 0;

    // Total tables
    const totalTables = db.get('SELECT COUNT(*) as count FROM tables_info')?.count || 0;

    // Kitchen load: orders in 'received' or 'preparing'
    const kitchenLoad = db.get("SELECT COUNT(*) as count FROM orders WHERE status IN ('received','preparing')")?.count || 0;

    // Orders by status
    const ordersByStatus = db.all(
      "SELECT status, COUNT(*) as count FROM orders GROUP BY status"
    );

    // Top selling items
    const topItems = db.all(
      `SELECT m.name, SUM(oi.quantity) as totalSold
       FROM order_items oi
       LEFT JOIN menu_items m ON oi.menuItemId = m.id
       GROUP BY oi.menuItemId
       ORDER BY totalSold DESC
       LIMIT 5`
    );

    // Revenue by day (last 7 days)
    const revenueByDay = db.all(
      `SELECT DATE(generatedAt) as date, COALESCE(SUM(amount), 0) as revenue
       FROM bills
       WHERE generatedAt >= DATE('now', '-7 days')
       GROUP BY DATE(generatedAt)
       ORDER BY date ASC`
    );

    // Total customers
    const totalCustomers = db.get("SELECT COUNT(*) as count FROM users WHERE role = 'customer'")?.count || 0;

    // Pending reservations
    const pendingReservations = db.get("SELECT COUNT(*) as count FROM reservations WHERE status = 'pending'")?.count || 0;

    return success(res, {
      totalOrders,
      revenue,
      activeTables,
      totalTables,
      kitchenLoad,
      totalCustomers,
      pendingReservations,
      ordersByStatus,
      topSellingItems: topItems,
      revenueByDay,
    }, 'Dashboard summary fetched');
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboardSummary };
