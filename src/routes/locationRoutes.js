const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

router.get('/locations', locationController.getLocations);
router.get('/locations/search', locationController.searchLocations);
router.get('/locations/:id', locationController.getLocationById);
router.get('/locations/:id/navigation', locationController.getNavigationData);

module.exports = router;