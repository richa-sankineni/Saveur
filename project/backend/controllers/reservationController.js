const db = require('../config/db');
const { success, error, paginated } = require('../utils/responseHandler');

const createReservation = (req, res, next) => {
  try {
    const { tableId, reservationTime, guestsCount } = req.body;
    const customerId = req.user.id;

    const table = db.get('SELECT * FROM tables_info WHERE id = ?', [tableId]);
    if (!table) return error(res, 'Table not found', 404);

    if (guestsCount > table.capacity) {
      return error(res, `Table capacity is ${table.capacity}, but ${guestsCount} guests requested`, 400);
    }

    // Check for conflicting reservation (within 2 hours)
    const conflicting = db.get(
      `SELECT id FROM reservations
       WHERE tableId = ? AND status != 'cancelled'
       AND ABS(strftime('%s', reservationTime) - strftime('%s', ?)) < 7200`,
      [tableId, reservationTime]
    );
    if (conflicting) {
      return error(res, 'Table already reserved within 2 hours of requested time', 409);
    }

    const id = db.run(
      'INSERT INTO reservations (customerId, tableId, reservationTime, guestsCount, status) VALUES (?, ?, ?, ?, ?)',
      [customerId, tableId, reservationTime, guestsCount, 'pending']
    );

    const reservation = db.get(
      `SELECT r.*, u.name as customerName, t.tableNumber
       FROM reservations r
       LEFT JOIN users u ON r.customerId = u.id
       LEFT JOIN tables_info t ON r.tableId = t.id
       WHERE r.id = ?`,
      [id]
    );

    return success(res, reservation, 'Reservation created', 201);
  } catch (err) {
    next(err);
  }
};

const getReservations = (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = [];
    let params = [];

    if (req.user.role === 'customer') {
      conditions.push('r.customerId = ?');
      params.push(req.user.id);
    }

    if (status) {
      conditions.push('r.status = ?');
      params.push(status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db.get(`SELECT COUNT(*) as total FROM reservations r ${where}`, params);
    const reservations = db.all(
      `SELECT r.*, u.name as customerName, t.tableNumber
       FROM reservations r
       LEFT JOIN users u ON r.customerId = u.id
       LEFT JOIN tables_info t ON r.tableId = t.id
       ${where}
       ORDER BY r.reservationTime ASC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    return paginated(res, reservations, countRow.total, page, limit, 'Reservations fetched');
  } catch (err) {
    next(err);
  }
};

const updateReservationStatus = (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['pending', 'confirmed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return error(res, 'Invalid status', 400);
    }

    const reservation = db.get('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    if (!reservation) return error(res, 'Reservation not found', 404);

    db.run('UPDATE reservations SET status = ? WHERE id = ?', [status, req.params.id]);

    // Update table status on confirmation
    if (status === 'confirmed') {
      db.run('UPDATE tables_info SET status = ? WHERE id = ?', ['reserved', reservation.tableId]);
    } else if (status === 'cancelled') {
      db.run('UPDATE tables_info SET status = ? WHERE id = ?', ['available', reservation.tableId]);
    }

    const updated = db.get(
      `SELECT r.*, u.name as customerName, t.tableNumber
       FROM reservations r
       LEFT JOIN users u ON r.customerId = u.id
       LEFT JOIN tables_info t ON r.tableId = t.id
       WHERE r.id = ?`,
      [req.params.id]
    );

    return success(res, updated, 'Reservation updated');
  } catch (err) {
    next(err);
  }
};

module.exports = { createReservation, getReservations, updateReservationStatus };
