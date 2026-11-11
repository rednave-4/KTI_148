const express = require('express');
const router = express.Router();

const announcementController = require('../controllers/announcementController');
const { requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// PUBLIC
router.get('/', announcementController.getPublicAnnouncements);

// ADMIN (harus sebelum /:id)
router.get('/admin/list', requireAdmin, announcementController.getAdminAnnouncements);
router.get('/admin/stats', requireAdmin, announcementController.getAdminStats);
router.post('/admin', requireAdmin, upload.single('poster'), announcementController.createAnnouncement);
router.put('/admin/:id', requireAdmin, upload.single('poster'), announcementController.updateAnnouncement);
router.patch('/admin/:id/status', requireAdmin, announcementController.updateStatus);
router.delete('/admin/:id', requireAdmin, announcementController.deleteAnnouncement);

// Public detail
router.get('/:id', announcementController.getPublicAnnouncementById);

module.exports = router;