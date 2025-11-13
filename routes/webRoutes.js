const express = require('express');
const pageController = require('../controllers/pageController');

const router = express.Router();

router.get('/', pageController.renderHome);
router.get('/menu', pageController.renderMenu);
router.get('/outlets', pageController.renderOutlets);
router.get('/contact', pageController.renderContact);
router.get('/cart', pageController.renderCart);
router.get('/checkout', pageController.renderCheckout);
router.get('/orders', pageController.renderOrder);
router.get('/order', pageController.renderOrder);

// Admin
router.get('/admin', pageController.renderAdminDashboard);
router.get('/admin/outlets', pageController.renderAdminOutlets);
router.get('/admin/menu-items', pageController.renderAdminMenu);
router.get('/admin/orders', pageController.renderAdminOrders);

module.exports = router;

