const db = require('../config/db');

const getBillByOrderId = (orderId) => {
  const bill = db.get(
    `SELECT b.*, o.totalAmount, o.status as orderStatus,
      u.name as customerName, t.tableNumber
     FROM bills b
     LEFT JOIN orders o ON b.orderId = o.id
     LEFT JOIN users u ON o.customerId = u.id
     LEFT JOIN tables_info t ON o.tableId = t.id
     WHERE b.orderId = ?`,
    [orderId]
  );
  return bill;
};

const markBillPaid = (orderId) => {
  const bill = db.get('SELECT * FROM bills WHERE orderId = ?', [orderId]);
  if (!bill) throw Object.assign(new Error('Bill not found'), { statusCode: 404 });
  if (bill.paymentStatus === 'paid') {
    throw Object.assign(new Error('Bill is already paid'), { statusCode: 400 });
  }

  db.run('UPDATE bills SET paymentStatus = ? WHERE orderId = ?', ['paid', orderId]);
  return getBillByOrderId(orderId);
};

module.exports = { getBillByOrderId, markBillPaid };
