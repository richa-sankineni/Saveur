const db = require('../config/db');
const orderService = require('../services/orderService');
const { success, error, paginated } = require('../utils/responseHandler');

const createOrder = (req, res, next) => {
  try {
    const { tableId, items, waiterId } = req.body;
    const customerId = req.user.id;

    const order = orderService.createOrder(customerId, tableId, items);

    // Optionally assign waiter
    if (waiterId) {
      db.run('UPDATE orders SET waiterId = ? WHERE id = ?', [waiterId, order.id]);
    }

    // Emit socket event for kitchen
    const io = req.app.get('io');
    if (io) {
      io.to('kitchen').emit('new_order', { order });
    }

    return success(res, order, 'Order created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getOrders = (req, res, next) => {
  try {
    const { status, tableNumber, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = [];
    let params = [];

    // Customers only see their own orders
    if (req.user.role === 'customer') {
      conditions.push('o.customerId = ?');
      params.push(req.user.id);
    }

    if (status) {
      conditions.push('o.status = ?');
      params.push(status);
    }

    if (tableNumber) {
      conditions.push('t.tableNumber = ?');
      params.push(parseInt(tableNumber));
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db.get(
      `SELECT COUNT(*) as total FROM orders o
       LEFT JOIN tables_info t ON o.tableId = t.id ${where}`,
      params
    );

    const orders = db.all(
      `SELECT o.*, u.name as customerName, t.tableNumber, w.name as waiterName
       FROM orders o
       LEFT JOIN users u ON o.customerId = u.id
       LEFT JOIN tables_info t ON o.tableId = t.id
       LEFT JOIN users w ON o.waiterId = w.id
       ${where}
       ORDER BY o.createdAt DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    return paginated(res, orders, countRow.total, page, limit, 'Orders fetched');
  } catch (err) {
    next(err);
  }
};

const getOrder = (req, res, next) => {
  try {
    const order = orderService.getOrderById(req.params.id);
    if (!order) return error(res, 'Order not found', 404);

    // Customers can only view their own order
    if (req.user.role === 'customer' && order.customerId !== req.user.id) {
      return error(res, 'Access denied', 403);
    }

    return success(res, order, 'Order fetched');
  } catch (err) {
    next(err);
  }
};

const updateOrderStatus = (req, res, next) => {
  try {
    const { status } = req.body;
    const updated = orderService.updateOrderStatus(req.params.id, status, req.user.id);

    const io = req.app.get('io');
    if (io) {
      io.emit('order_status_updated', { orderId: req.params.id, status, order: updated });
    }

    return success(res, updated, `Order status updated to "${status}"`);
  } catch (err) {
    next(err);
  }
};

const deleteOrder = (req, res, next) => {
  try {
    const order = db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return error(res, 'Order not found', 404);

    if (order.status !== 'received') {
      return error(res, 'Only orders in "received" status can be deleted', 400);
    }

    db.run('DELETE FROM order_items WHERE orderId = ?', [req.params.id]);
    db.run('DELETE FROM orders WHERE id = ?', [req.params.id]);
    // Free table
    db.run('UPDATE tables_info SET status = ? WHERE id = ?', ['available', order.tableId]);

    return success(res, null, 'Order deleted');
  } catch (err) {
    next(err);
  }
};

const assignWaiter = (req, res, next) => {
  try {
    const { waiterId } = req.body;
    const waiter = db.get('SELECT id FROM users WHERE id = ? AND role = ?', [waiterId, 'waiter']);
    if (!waiter) return error(res, 'Waiter not found', 404);

    const order = db.get('SELECT id FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return error(res, 'Order not found', 404);

    db.run('UPDATE orders SET waiterId = ? WHERE id = ?', [waiterId, req.params.id]);
    const updated = orderService.getOrderById(req.params.id);
    return success(res, updated, 'Waiter assigned');
  } catch (err) {
    next(err);
  }
};

module.exports = { createOrder, getOrders, getOrder, updateOrderStatus, deleteOrder, assignWaiter };
