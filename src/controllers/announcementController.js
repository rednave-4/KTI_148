const pool = require('../config/database');

// --- ENDPOINT PUBLIK (Dengan Deteksi Otomatis Status Done + Search & Filter) ---
exports.getPublicAnnouncements = async (req, res, next) => {
  try {
    const { search, category } = req.query;

    let query = `
      SELECT a.announcement_id, a.title, a.slug, a.description, a.event_date,
             a.start_time, a.end_time, a.image_path, a.published_at, a.category,
             l.location_id, l.name AS location_name,
             CASE 
               WHEN a.status = 'published' AND CONCAT(a.event_date, ' ', COALESCE(a.end_time, a.start_time)) < NOW() 
               THEN 'done'
               ELSE a.status
             END AS computed_status
      FROM announcements a
      LEFT JOIN locations l ON a.location_id = l.location_id
      WHERE a.status IN ('published', 'done')
    `;

    const params = [];

    if (search && search.trim()) {
      query += ` AND (a.title LIKE ? OR a.description LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    if (category && category.trim() && category !== 'all') {
      query += ` AND a.category = ?`;
      params.push(category.trim().toLowerCase());
    }

    query += `
      ORDER BY 
        CASE WHEN CONCAT(a.event_date, ' ', COALESCE(a.end_time, a.start_time)) < NOW() THEN 1 ELSE 0 END ASC,
        a.published_at DESC
    `;

    const [rows] = await pool.execute(query, params);

    return res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

exports.getPublicAnnouncementById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(`
      SELECT a.announcement_id, a.title, a.slug, a.description, a.event_date,
             a.start_time, a.end_time, a.image_path, a.published_at, a.category,
             l.location_id, l.name AS location_name, l.parent_location_id
      FROM announcements a
      LEFT JOIN locations l ON a.location_id = l.location_id
      WHERE a.announcement_id = ? AND a.status IN ('published', 'done')
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pengumuman tidak ditemukan.' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
};

// --- ENDPOINT ADMIN ---
exports.getAdminAnnouncements = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`
      SELECT a.*, l.name AS location_name, adm.full_name AS author_name
      FROM announcements a
      LEFT JOIN locations l ON a.location_id = l.location_id
      LEFT JOIN admins adm ON a.admin_id = adm.admin_id
      ORDER BY a.created_at DESC
    `);

    return res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

// Statistik untuk Dashboard Admin
exports.getAdminStats = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'published' AND CONCAT(event_date, ' ', COALESCE(end_time, start_time)) >= NOW() THEN 1 ELSE 0 END) AS aktif,
        SUM(CASE WHEN status = 'published' AND CONCAT(event_date, ' ', COALESCE(end_time, start_time)) < NOW() THEN 1 ELSE 0 END) AS selesai,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft,
        SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) AS archived
      FROM announcements
    `);

    return res.json({
      success: true,
      data: {
        total: rows[0].total || 0,
        aktif: rows[0].aktif || 0,
        selesai: rows[0].selesai || 0,
        draft: rows[0].draft || 0,
        archived: rows[0].archived || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.createAnnouncement = async (req, res, next) => {
  try {
    const { title, description, event_date, start_time, end_time, location_id, status, category } = req.body;
    const admin_id = req.session.admin.id;
    const image_path = req.file ? `/uploads/posters/${req.file.filename}` : null;

    if (!title || !description || !event_date || !start_time) {
      return res.status(400).json({ success: false, message: 'Judul, deskripsi, tanggal, dan waktu mulai wajib diisi.' });
    }

    const annStatus = status ? status.toLowerCase() : 'published';
    const annCategory = category ? category.toLowerCase() : 'umum';
    const published_at = (annStatus === 'published') ? new Date() : null;

    const [result] = await pool.execute(`
      INSERT INTO announcements 
      (admin_id, location_id, title, description, event_date, start_time, end_time, image_path, category, status, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [admin_id, location_id || null, title, description, event_date, start_time, end_time || null, image_path, annCategory, annStatus, published_at]);

    return res.status(201).json({
      success: true,
      message: 'Pengumuman berhasil dibuat.',
      announcement_id: result.insertId
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, event_date, start_time, end_time, location_id, status, category } = req.body;

    const [existing] = await pool.execute('SELECT image_path, status FROM announcements WHERE announcement_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Pengumuman tidak ditemukan.' });
    }

    let image_path = existing[0].image_path;
    if (req.file) {
      image_path = `/uploads/posters/${req.file.filename}`;
    }

    const annStatus = status ? status.toLowerCase() : existing[0].status;
    const annCategory = category ? category.toLowerCase() : 'umum';

    let published_at = null;
    if (annStatus === 'published' && existing[0].status !== 'published') {
      published_at = new Date();
    }

    await pool.execute(`
      UPDATE announcements 
      SET title = ?, description = ?, event_date = ?, start_time = ?, end_time = ?, 
          location_id = ?, image_path = ?, category = ?, status = ?,
          published_at = COALESCE(?, published_at)
      WHERE announcement_id = ?
    `, [title, description, event_date, start_time, end_time || null, location_id || null, image_path, annCategory, annStatus, published_at, id]);

    return res.json({ success: true, message: 'Pengumuman berhasil diperbarui.' });
  } catch (error) {
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['draft', 'published', 'archived'].includes(status.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Status tidak valid.' });
    }

    const annStatus = status.toLowerCase();
    const publishedClause = annStatus === 'published' ? ', published_at = NOW()' : '';

    const [result] = await pool.execute(
      `UPDATE announcements SET status = ? ${publishedClause} WHERE announcement_id = ?`,
      [annStatus, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Pengumuman tidak ditemukan.' });
    }

    return res.json({ success: true, message: `Status berhasil diubah menjadi ${annStatus}.` });
  } catch (error) {
    next(error);
  }
};

exports.deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM announcements WHERE announcement_id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Pengumuman tidak ditemukan.' });
    }

    return res.json({ success: true, message: 'Pengumuman berhasil dihapus.' });
  } catch (error) {
    next(error);
  }
};