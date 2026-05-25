const billService = require('../services/billService');
const { success, error } = require('../utils/responseHandler');
const db = require('../config/db');

const getBill = (req, res, next) => {
  try {
    const bill = billService.getBillByOrderId(req.params.orderId);
    if (!bill) return error(res, 'Bill not found for this order', 404);
    return success(res, bill, 'Bill fetched');
  } catch (err) {
    next(err);
  }
};

const payBill = (req, res, next) => {
  try {
    const bill = billService.markBillPaid(req.params.orderId);
    return success(res, bill, 'Bill marked as paid');
  } catch (err) {
    next(err);
  }
};

const getAllBills = (req, res, next) => {
  try {
    const { paymentStatus, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = [];
    let params = [];

    if (paymentStatus) {
      conditions.push('b.paymentStatus = ?');
      params.push(paymentStatus);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db.get(`SELECT COUNT(*) as total FROM bills b ${where}`, params);
    const bills = db.all(
      `SELECT b.*, o.totalAmount, o.status as orderStatus, u.name as customerName, t.tableNumber
       FROM bills b
       LEFT JOIN orders o ON b.orderId = o.id
       LEFT JOIN users u ON o.customerId = u.id
       LEFT JOIN tables_info t ON o.tableId = t.id
       ${where}
       ORDER BY b.generatedAt DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    return res.status(200).json({
      success: true,
      message: 'Bills fetched',
      data: bills,
      pagination: {
        total: countRow.total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countRow.total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getBill, payBill, getAllBills };
