const pool = require('../config/database');
const argon2 = require('argon2');

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi.' });
    }

    const [rows] = await pool.execute(
      'SELECT admin_id, username, password_hash, full_name, is_active FROM admins WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Username atau password salah.' });
    }

    const admin = rows[0];

    if (!admin.is_active) {
      return res.status(403).json({ success: false, message: 'Akun admin ini nonaktif.' });
    }

    const validPassword = await argon2.verify(admin.password_hash, password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Username atau password salah.' });
    }

    // Simpan data admin di session
    req.session.admin = {
      id: admin.admin_id,
      username: admin.username,
      fullName: admin.full_name
    };

    return res.json({
      success: true,
      message: 'Login berhasil.',
      data: req.session.admin
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Gagal logout.' });
    }
    res.clearCookie('sid');
    return res.json({ success: true, message: 'Berhasil logout.' });
  });
};

exports.getMe = (req, res) => {
  if (req.session && req.session.admin) {
    return res.json({ success: true, loggedIn: true, data: req.session.admin });
  }
  return res.json({ success: true, loggedIn: false, data: null });
};