const express = require('express');
const router  = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getApprovedProducts } = require('../controllers/productController');
const { placeOrder, getMyOrders } = require('../controllers/orderController');

// GET /api/customer/products  (public — no auth needed to browse)
router.get('/products', getApprovedProducts);

// Below routes require customer login
router.post('/orders', verifyToken, requireRole('customer'), placeOrder);
router.get('/orders',  verifyToken, requireRole('customer'), getMyOrders);

module.exports = router;
