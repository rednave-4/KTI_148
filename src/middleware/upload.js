const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tentukan lokasi penyimpanan poster
const uploadDir = process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.resolve(__dirname, '../../public/uploads/posters');

// Pastikan folder tersedia
fs.mkdirSync(uploadDir, { recursive: true });

// Konfigurasi penyimpanan
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },

    filename: function (req, file, cb) {
        const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1E9);

        const ext = path.extname(file.originalname).toLowerCase();

        cb(null, 'poster-' + uniqueSuffix + ext);
    }
});

// Validasi format gambar
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error('Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.'),
            false
        );
    }
};

// Konfigurasi Multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

module.exports = upload;