const express = require('express');
const path = require('path');
const helmet = require('helmet');
const session = require('express-session');
require('dotenv').config();

const app = express();

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false // Dinonaktifkan sementara agar pemuatan inline SVG & aset berjalan lancar
}));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Management
app.set('trust proxy', 1);
app.use(session({
  secret: process.env.SESSION_SECRET || 'rahasia_sekolah_123',
  resave: false,
  saveUninitialized: false,
  proxy: true, // PENTING: Agar Railway membaca protokol HTTPS dari proxy
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true jika di Railway (HTTPS)
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' wajib jika frontend dan backend terpisah atau menggunakan HTTPS Railway
    maxAge: 24 * 60 * 60 * 1000 // 1 hari
  }
}));

// ==================== ROUTES API ====================
const authRoutes = require('./routes/authRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const locationRoutes = require('./routes/locationRoutes');

// Daftarkan router ke aplikasi
app.use('/api/admin/auth', authRoutes); // /api/admin/auth/login, /logout, /me
app.use('/api', announcementRoutes);    // /api/public/announcements & /api/admin/announcements
app.use('/api', locationRoutes);        // /api/locations, /api/locations/search, dll.
// ====================================================

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server berjalan dengan baik',
    timestamp: new Date().toISOString()
  });
});

// Static Files (Frontend HTML, CSS, JS, SVG maps, Uploads)
app.use(express.static(path.join(__dirname, '../public')));

// Static Files untuk Folder Uploads (PENTING agar foto bisa diakses publik)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Fallback Route untuk Frontend SPA / Root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global Error Handler Middleware
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = app;