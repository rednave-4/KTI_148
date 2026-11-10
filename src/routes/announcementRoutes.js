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
// (akan di-mount di /api/admin/announcements)
// ======================
router.get('/', requireAdmin, announcementController.getAdminAnnouncements);
router.post('/', requireAdmin, upload.single('poster'), announcementController.createAnnouncement);
router.put('/:id', requireAdmin, upload.single('poster'), announcementController.updateAnnouncement);
router.patch('/:id/status', requireAdmin, announcementController.updateStatus);
router.delete('/:id', requireAdmin, announcementController.deleteAnnouncement);

module.exports = router;