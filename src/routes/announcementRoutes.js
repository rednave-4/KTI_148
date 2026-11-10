const express = require('express');
const router = express.Router();

const announcementController = require('../controllers/announcementController');
const { requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Endpoint Publik (Path relatif terhadap /api/announcements)
router.get('/', announcementController.getPublicAnnouncements);
router.get('/:id', announcementController.getPublicAnnouncementById);

// Endpoint Admin (Path relatif terhadap /api/announcements)
router.get('/admin', requireAdmin, announcementController.getAdminAnnouncements);
router.post('/admin', requireAdmin, upload.single('poster'), announcementController.createAnnouncement);
router.put('/admin/:id', requireAdmin, upload.single('poster'), announcementController.updateAnnouncement);
router.patch('/admin/:id/status', requireAdmin, announcementController.updateStatus);
router.delete('/admin/:id', requireAdmin, announcementController.deleteAnnouncement);

module.exports = router;