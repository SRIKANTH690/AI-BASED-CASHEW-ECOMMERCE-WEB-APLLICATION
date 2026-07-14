const express = require('express');
const router  = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  getPendingProducts,
  approveProduct,
  rejectProduct,
  getAdminStats,
  analyseProduct,
  deleteProduct
} = require('../controllers/productController');
const { getAllOrders }    = require('../controllers/orderController');
const { getEnquiries }   = require('../controllers/enquiryController');
const UserModel          = require('../models/userModel');

router.use(verifyToken, requireRole('admin'));

// GET /api/admin/pending
router.get('/pending', getPendingProducts);

// POST /api/admin/approve/:id
router.post('/approve/:id', approveProduct);

// POST /api/admin/reject/:id
router.post('/reject/:id', rejectProduct);

// POST /api/admin/analyse/:id  (admin-only AI analysis)
router.post('/analyse/:id', analyseProduct);

// DELETE /api/admin/delete-product/:id
router.delete('/delete-product/:id', deleteProduct);

// GET /api/admin/stats
router.get('/stats', getAdminStats);

// GET /api/admin/farmers
router.get('/farmers', async (req, res) => {
  try {
    const farmers = await UserModel.getAllFarmers();
    res.json({ farmers });
  } catch { res.status(500).json({ error: 'Server error.' }); }
});

// GET /api/admin/customers
router.get('/customers', async (req, res) => {
  try {
    const customers = await UserModel.getAllCustomers();
    res.json({ customers });
  } catch { res.status(500).json({ error: 'Server error.' }); }
});

// GET /api/admin/orders
router.get('/orders', getAllOrders);

// GET /api/admin/enquiries
router.get('/enquiries', getEnquiries);

module.exports = router;
