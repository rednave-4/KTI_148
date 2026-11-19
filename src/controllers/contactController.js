const pool = require('../config/database');

exports.getPublicContacts = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`
      SELECT contact_id, unit_name, description, phone, email, sort_order
      FROM contacts
      WHERE is_active = 1
      ORDER BY sort_order ASC, unit_name ASC
    `);
    return res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

exports.getAdminContacts = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`
      SELECT * FROM contacts ORDER BY sort_order ASC, unit_name ASC
    `);
    return res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

exports.createContact = async (req, res, next) => {
  try {
    const { unit_name, description, phone, email, sort_order, is_active } = req.body;
    if (!unit_name) {
      return res.status(400).json({ success: false, message: 'Nama unit wajib diisi.' });
    }
    const [result] = await pool.execute(`
      INSERT INTO contacts (unit_name, description, phone, email, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      unit_name,
      description || null,
      phone || null,
      email || null,
      sort_order ? Number(sort_order) : 0,
      is_active === undefined ? 1 : (is_active ? 1 : 0)
    ]);
    return res.status(201).json({ success: true, message: 'Kontak berhasil ditambah.', contact_id: result.insertId });
  } catch (error) {
    next(error);
  }
};

exports.updateContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { unit_name, description, phone, email, sort_order, is_active } = req.body;
    const [result] = await pool.execute(`
      UPDATE contacts
      SET unit_name = ?, description = ?, phone = ?, email = ?, sort_order = ?, is_active = ?
      WHERE contact_id = ?
    `, [
      unit_name,
      description || null,
      phone || null,
      email || null,
      sort_order ? Number(sort_order) : 0,
      is_active ? 1 : 0,
      id
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Kontak tidak ditemukan.' });
    }
    return res.json({ success: true, message: 'Kontak berhasil diperbarui.' });
  } catch (error) {
    next(error);
  }
};

exports.deleteContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM contacts WHERE contact_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Kontak tidak ditemukan.' });
    }
    return res.json({ success: true, message: 'Kontak berhasil dihapus.' });
  } catch (error) {
    next(error);
  }
};