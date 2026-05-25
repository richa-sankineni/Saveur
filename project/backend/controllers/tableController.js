const db = require('../config/db');
const { success, error, paginated } = require('../utils/responseHandler');

const createTable = (req, res, next) => {
  try {
    const { tableNumber, capacity } = req.body;

    if (!tableNumber || !capacity) {
      return error(res, 'tableNumber and capacity are required', 400);
    }

    const existing = db.get('SELECT id FROM tables_info WHERE tableNumber = ?', [tableNumber]);
    if (existing) return error(res, `Table number ${tableNumber} already exists`, 409);

    const id = db.run(
      'INSERT INTO tables_info (tableNumber, capacity, status) VALUES (?, ?, ?)',
      [tableNumber, capacity, 'available']
    );

    const table = db.get('SELECT * FROM tables_info WHERE id = ?', [id]);
    return success(res, table, 'Table created', 201);
  } catch (err) {
    next(err);
  }
};

const getTables = (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = [];
    let params = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRow = db.get(`SELECT COUNT(*) as total FROM tables_info ${where}`, params);
    const tables = db.all(
      `SELECT * FROM tables_info ${where} ORDER BY tableNumber ASC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    return paginated(res, tables, countRow.total, page, limit, 'Tables fetched');
  } catch (err) {
    next(err);
  }
};

const updateTable = (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = db.get('SELECT * FROM tables_info WHERE id = ?', [id]);
    if (!existing) return error(res, 'Table not found', 404);

    const { tableNumber, capacity, status } = req.body;
    const allowedStatuses = ['available', 'occupied', 'reserved'];

    if (status && !allowedStatuses.includes(status)) {
      return error(res, 'Invalid status. Must be: available, occupied, or reserved', 400);
    }

    db.run(
      `UPDATE tables_info SET
        tableNumber = COALESCE(?, tableNumber),
        capacity = COALESCE(?, capacity),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [tableNumber || null, capacity || null, status || null, id]
    );

    const updated = db.get('SELECT * FROM tables_info WHERE id = ?', [id]);
    return success(res, updated, 'Table updated');
  } catch (err) {
    next(err);
  }
};

module.exports = { createTable, getTables, updateTable };
