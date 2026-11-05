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
app.use(session({
  name: 'sid',
  secret: process.env.SESSION_SECRET || 'rahasia_sementara',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 8 // 8 Jam
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

// Fallback Route untuk Frontend SPA / Root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global Error Handler Middleware
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = app;