const express = require('express');
const router = express.Router();

// 1. Lakukan require terlebih dahulu di paling atas
const announcementController = require('../controllers/announcementController');
const { requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// (Opsional) Cek di sini setelah require berhasil
console.log("ISI CONTROLLER:", announcementController);

// Endpoint Publik
router.get('/public/announcements', announcementController.getPublicAnnouncements);
router.get('/public/announcements/:id', announcementController.getPublicAnnouncementById);

// Endpoint Admin
router.get('/admin/announcements', requireAdmin, announcementController.getAdminAnnouncements);
router.post('/admin/announcements', requireAdmin, upload.single('poster'), announcementController.createAnnouncement);
router.put('/admin/announcements/:id', requireAdmin, upload.single('poster'), announcementController.updateAnnouncement);
router.patch('/admin/announcements/:id/status', requireAdmin, announcementController.updateStatus);
router.delete('/admin/announcements/:id', requireAdmin, announcementController.deleteAnnouncement);

module.exports = router;