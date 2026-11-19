const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { requireAdmin } = require('../middleware/auth');

router.get('/', contactController.getPublicContacts);
router.get('/admin', requireAdmin, contactController.getAdminContacts);
router.post('/admin', requireAdmin, contactController.createContact);
router.put('/admin/:id', requireAdmin, contactController.updateContact);
router.delete('/admin/:id', requireAdmin, contactController.deleteContact);

module.exports = router;