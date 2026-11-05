const pool = require('../config/database');

exports.getLocations = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`
      SELECT location_id, parent_location_id, name, location_type, description, sort_order
      FROM locations
      WHERE is_active = 1
      ORDER BY sort_order ASC, name ASC
    `);

    return res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

exports.searchLocations = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.status(400).json({ success: false, message: 'Kata kunci pencarian tidak boleh kosong.' });
    }

    const searchTerm = `%${q.trim()}%`;
    const [rows] = await pool.execute(`
      SELECT l.location_id, l.name, l.location_type, l.description,
             p.name AS parent_name,
             me.svg_element_id, m.map_id, m.map_name, m.svg_path
      FROM locations l
      LEFT JOIN locations p ON l.parent_location_id = p.location_id
      LEFT JOIN map_elements me ON l.location_id = me.location_id
      LEFT JOIN maps m ON me.map_id = m.map_id
      WHERE l.is_active = 1 AND (l.name LIKE ? OR l.description LIKE ?)
      LIMIT 10
    `, [searchTerm, searchTerm]);

    return res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

exports.getLocationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(`
      SELECT l.*, p.name AS parent_name
      FROM locations l
      LEFT JOIN locations p ON l.parent_location_id = p.location_id
      WHERE l.location_id = ? AND l.is_active = 1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Lokasi tidak ditemukan.' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.getNavigationData = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Ambil detail lokasi
    const [locRows] = await pool.execute('SELECT * FROM locations WHERE location_id = ?', [id]);
    if (locRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Lokasi tidak ditemukan.' });
    }

    const location = locRows[0];

    // Ambil informasi peta SVG yang menampung elemen lokasi ini
    const [mapRows] = await pool.execute(`
      SELECT m.map_id, m.map_name, m.map_type, m.svg_path, me.svg_element_id
      FROM map_elements me
      JOIN maps m ON me.map_id = m.map_id
      WHERE me.location_id = ?
    `, [id]);

    return res.json({
      success: true,
      location: location,
      map_info: mapRows.length > 0 ? mapRows[0] : null
    });
  } catch (error) {
    next(error);
  }
};