const express = require('express');

const menuRoutes = require('./menuRoutes');
const outletRoutes = require('./outletRoutes');
const orderRoutes = require('./orderRoutes');

const router = express.Router();

router.use('/menu-items', menuRoutes);
router.use('/outlets', outletRoutes);
router.use('/orders', orderRoutes);

module.exports = router;

