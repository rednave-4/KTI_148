const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

// Karena sudah di-mount di /api/locations, path di sini harus relatif
router.get('/', locationController.getLocations);
router.get('/search', locationController.searchLocations);
router.get('/:id', locationController.getLocationById);
router.get('/:id/navigation', locationController.getNavigationData);

module.exports = router;