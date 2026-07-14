const express   = require('express');
const router    = express.Router();
const upload    = require('../config/multer');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  uploadProduct,
  getMyProducts
} = require('../controllers/productController');

// All farmer routes require JWT + farmer role
router.use(verifyToken, requireRole('farmer'));

// POST /api/farmer/upload
router.post('/upload', upload.single('image'), uploadProduct);

// GET /api/farmer/products
router.get('/products', getMyProducts);

// DELETE /api/farmer/delete/:id
router.delete('/delete/:id', async (req, res) => {
  try {
    const pool = require('../database/db');
    // Only allow farmer to delete their own product
    const { rows } = await pool.query(
      'DELETE FROM products WHERE id=$1 AND farmer_id=$2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if(!rows.length) return res.status(404).json({ error: 'Product not found or not yours.' });
    res.json({ message: 'Product deleted.' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
