function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Akses ditolak. Silakan login sebagai administrator.'
  });
}

module.exports = { requireAdmin }; // Perhatikan harus menggunakan objek/kurung kurawal atau exports langsung