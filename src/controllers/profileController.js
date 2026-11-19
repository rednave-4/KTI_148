const pool = require('../config/database');

exports.getProfile = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`
      SELECT section_key, title, content FROM school_profile ORDER BY profile_id ASC
    `);
    return res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};