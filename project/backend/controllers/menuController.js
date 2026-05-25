const db = require('../config/db');
const { success, error, paginated } = require('../utils/responseHandler');

const createMenuItem = (req, res, next) => {
  try {
    const { name, category, price, availability = true, image = null, description = null } = req.body;

    const id = db.run(
      'INSERT INTO menu_items (name, category, price, availability, image, description) VALUES (?, ?, ?, ?, ?, ?)',
      [name, category, price, availability ? 1 : 0, image, description]
    );

    const item = db.get('SELECT * FROM menu_items WHERE id = ?', [id]);
    return success(res, item, 'Menu item created', 201);
  } catch (err) {
    next(err);
  }
};

const getMenuItems = (req, res, next) => {
  try {
    const { category, available, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = [];
    let params = [];

    if (category) {
      conditions.push('LOWER(category) = LOWER(?)');
      params.push(category);
    }

    if (available !== undefined) {
      conditions.push('availability = ?');
      params.push(available === 'true' ? 1 : 0);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db.get(`SELECT COUNT(*) as total FROM menu_items ${where}`, params);
    const items = db.all(
      `SELECT * FROM menu_items ${where} LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    return paginated(res, items, countRow.total, page, limit, 'Menu items fetched');
  } catch (err) {
    next(err);
  }
};

const getMenuItem = (req, res, next) => {
  try {
    const item = db.get('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
    if (!item) return error(res, 'Menu item not found', 404);
    return success(res, item, 'Menu item fetched');
  } catch (err) {
    next(err);
  }
};

const updateMenuItem = (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = db.get('SELECT * FROM menu_items WHERE id = ?', [id]);
    if (!existing) return error(res, 'Menu item not found', 404);

    const { name, category, price, availability, image, description } = req.body;

    db.run(
      `UPDATE menu_items SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        price = COALESCE(?, price),
        availability = COALESCE(?, availability),
        image = COALESCE(?, image),
        description = COALESCE(?, description)
       WHERE id = ?`,
      [
        name || null,
        category || null,
        price || null,
        availability !== undefined ? (availability ? 1 : 0) : null,
        image || null,
        description || null,
        id,
      ]
    );

    const updated = db.get('SELECT * FROM menu_items WHERE id = ?', [id]);
    return success(res, updated, 'Menu item updated');
  } catch (err) {
    next(err);
  }
};

const deleteMenuItem = (req, res, next) => {
  try {
    const existing = db.get('SELECT id FROM menu_items WHERE id = ?', [req.params.id]);
    if (!existing) return error(res, 'Menu item not found', 404);

    db.run('DELETE FROM menu_items WHERE id = ?', [req.params.id]);
    return success(res, null, 'Menu item deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { createMenuItem, getMenuItems, getMenuItem, updateMenuItem, deleteMenuItem };
