function errorHandler(err, req, res, next) {
  console.error('[Error]', err.stack || err.message);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: `Error upload file: ${err.message}`
    });
  }

  return res.status(500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada server.'
  });
}

module.exports = errorHandler;