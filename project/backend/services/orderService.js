const db = require('../config/db');

const createOrder = (customerId, tableId, items) => {
 
  const table = db.get('SELECT * FROM tables_info WHERE id = ?', [tableId]);
  if (!table) throw Object.assign(new Error('Table not found'), { statusCode: 404 });
  if (table.status === 'occupied') {
    throw Object.assign(new Error('Table is currently occupied'), { statusCode: 400 });
  }


  const resolvedItems = items.map((item) => {
    const menuItem = db.get('SELECT * FROM menu_items WHERE id = ?', [item.menuItemId]);
    if (!menuItem) {
      throw Object.assign(new Error(`Menu item ${item.menuItemId} not found`), { statusCode: 404 });
    }
    if (!menuItem.availability) {
      throw Object.assign(new Error(`Menu item "${menuItem.name}" is not available`), { statusCode: 400 });
    }
    return { ...item, itemPrice: menuItem.price, name: menuItem.name };
  });

  const totalAmount = resolvedItems.reduce(
    (sum, item) => sum + item.itemPrice * item.quantity,
    0
  );

  const result = db.transaction((tx) => {
    
    const orderId = tx.run(
      'INSERT INTO orders (customerId, tableId, status, totalAmount) VALUES (?, ?, ?, ?)',
      [customerId, tableId, 'received', totalAmount]
    );

    
    for (const item of resolvedItems) {
      tx.run(
        'INSERT INTO order_items (orderId, menuItemId, quantity, itemPrice) VALUES (?, ?, ?, ?)',
        [orderId, item.menuItemId, item.quantity, item.itemPrice]
      );
    }

    
    tx.run('UPDATE tables_info SET status = ? WHERE id = ?', ['occupied', tableId]);

    return orderId;
  });

  return getOrderById(result);
};


const getOrderById = (orderId) => {
  const order = db.get(
    `SELECT o.*, 
      u.name as customerName,
      t.tableNumber,
      w.name as waiterName
     FROM orders o
     LEFT JOIN users u ON o.customerId = u.id
     LEFT JOIN tables_info t ON o.tableId = t.id
     LEFT JOIN users w ON o.waiterId = w.id
     WHERE o.id = ?`,
    [orderId]
  );

  if (!order) return null;

  const items = db.all(
    `SELECT oi.*, m.name as menuItemName, m.category
     FROM order_items oi
     LEFT JOIN menu_items m ON oi.menuItemId = m.id
     WHERE oi.orderId = ?`,
    [orderId]
  );

  return { ...order, items };
};


const updateOrderStatus = (orderId, newStatus, updatedBy) => {
  const order = db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });

  const validTransitions = {
    received: ['preparing'],
    preparing: ['ready'],
    ready: ['completed'],
    completed: [],
  };

  if (!validTransitions[order.status].includes(newStatus)) {
    throw Object.assign(
      new Error(`Invalid status transition: ${order.status} → ${newStatus}. Allowed: ${validTransitions[order.status].join(', ') || 'none'}`),
      { statusCode: 400 }
    );
  }

  db.run('UPDATE orders SET status = ? WHERE id = ?', [newStatus, orderId]);

 
  if (newStatus === 'completed') {
    const existingBill = db.get('SELECT id FROM bills WHERE orderId = ?', [orderId]);
    if (!existingBill) {
      db.run(
        'INSERT INTO bills (orderId, amount, paymentStatus) VALUES (?, ?, ?)',
        [orderId, order.totalAmount, 'pending']
      );
    }
    
    db.run('UPDATE tables_info SET status = ? WHERE id = ?', ['available', order.tableId]);
  }

  return getOrderById(orderId);
};

module.exports = { createOrder, getOrderById, updateOrderStatus };
