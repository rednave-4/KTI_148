const express = require('express');
const router = express.Router();

const announcementController = require('../controllers/announcementController');
const { requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// ======================
// PUBLIC ENDPOINTS
// ======================
router.get('/', announcementController.getPublicAnnouncements);
router.get('/:id', announcementController.getPublicAnnouncementById);

// ======================
// ADMIN ENDPOINTS
// Prefix: /api/announcements/admin
// ======================
router.get('/admin/list', requireAdmin, announcementController.getAdminAnnouncements);
router.post('/admin', requireAdmin, upload.single('poster'), announcementController.createAnnouncement);
router.put('/admin/:id', requireAdmin, upload.single('poster'), announcementController.updateAnnouncement);
router.patch('/admin/:id/status', requireAdmin, announcementController.updateStatus);
router.delete('/admin/:id', requireAdmin, announcementController.deleteAnnouncement);

module.exports = router;