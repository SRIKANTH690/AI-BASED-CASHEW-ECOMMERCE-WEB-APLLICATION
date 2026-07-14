const path        = require('path');
const fetch       = require('node-fetch');
const FormData    = require('form-data');
const fs          = require('fs');
const ProductModel = require('../models/productModel');
const pool        = require('../database/db');

exports.uploadProduct = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Cashew image is required.' });

    const { product_name, grade, quantity, price, description, latitude, longitude, harvest_date } = req.body;
    if (!product_name || !grade || !quantity || !price)
      return res.status(400).json({ error: 'product_name, grade, quantity and price are required.' });

    const image_url = '/uploads/' + req.file.filename;

    // Call AI microservice for prediction
    let prediction_grade = grade, prediction_score = null, confidence = null;
    try {
      const form = new FormData();
      form.append('file', fs.createReadStream(req.file.path));
      const aiRes  = await fetch(`${process.env.AI_SERVICE_URL}/predict`, { method: 'POST', body: form });
      if (aiRes.ok) {
        const aiData    = await aiRes.json();
        prediction_grade  = aiData.grade        || grade;
        prediction_score  = aiData.quality_score ?? null;
        confidence        = aiData.confidence    ?? null;
      }
    } catch (aiErr) {
      // AI service unavailable — continue without prediction
    }

    // Emit real-time notification to admin room
    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('new_product_pending', {
        farmer_name: req.user.name,
        grade: prediction_grade,
        submitted: new Date()
      });
    }

    const product = await ProductModel.create({
      farmer_id:  req.user.id,
      product_name, grade, quantity: +quantity, price: +price, description,
      image_url, latitude: latitude || null, longitude: longitude || null,
      harvest_date: harvest_date || null,
      prediction_grade, prediction_score, confidence
    });

    res.status(201).json({ message: 'Product submitted for admin approval.', product });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Server error during product upload.' });
  }
};

exports.getMyProducts = async (req, res) => {
  try {
    const products = await ProductModel.getByFarmer(req.user.id);
    // Strip AI prediction fields — farmers must NOT see AI scores
    const safe = products.map(p => ({
      id:           p.id,
      product_name: p.product_name,
      grade:        p.grade,
      quantity:     p.quantity,
      price:        p.price,
      description:  p.description,
      image_url:    p.image_url,
      latitude:     p.latitude,
      longitude:    p.longitude,
      upload_time:  p.upload_time,
      status:       p.status,
      reviewed_at:  p.reviewed_at
      // prediction_grade, prediction_score, confidence — intentionally omitted
    }));
    res.json({ products: safe });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.getApprovedProducts = async (req, res) => {
  try {
    const products = await ProductModel.getApproved();
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.getPendingProducts = async (req, res) => {
  try {
    const products = await ProductModel.getPending();
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.approveProduct = async (req, res) => {
  try {
    const product = await ProductModel.updateStatus(req.params.id, 'approved');
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    res.json({ message: 'Product approved and listed in marketplace.', product });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.rejectProduct = async (req, res) => {
  try {
    const product = await ProductModel.updateStatus(req.params.id, 'rejected');
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    res.json({ message: 'Product rejected.', product });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.getAdminStats = async (req, res) => {
  try {
    const stats = await ProductModel.getStats();
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// Admin-only: delete a product from marketplace
exports.deleteProduct = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM products WHERE id=$1 RETURNING id', [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found.' });
    res.json({ message: 'Product removed from marketplace.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// Admin-only: run AI analysis on demand for a specific product
exports.analyseProduct = async (req, res) => {
  try {
    const product = await ProductModel.getById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    // Build absolute path to the uploaded image
    const imagePath = require('path').join(__dirname, '..', 'uploads',
      require('path').basename(product.image_url));

    if (!fs.existsSync(imagePath))
      return res.status(404).json({ error: 'Image file not found on server.' });

    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath));

    const aiRes = await fetch(`${process.env.AI_SERVICE_URL}/predict`, {
      method: 'POST', body: form
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      return res.status(502).json({ error: 'AI service error: ' + err });
    }

    const aiData = await aiRes.json();

    // Save the prediction back to DB so it persists
    await ProductModel.savePrediction(req.params.id, {
      prediction_grade: aiData.grade,
      prediction_score: aiData.quality_score,
      confidence:       aiData.confidence
    });

    // Return full AI result — admin eyes only
    res.json({
      product_id:    product.id,
      grade:         aiData.grade,
      quality_score: aiData.quality_score,
      confidence:    aiData.confidence,
      predicted_class: aiData.predicted_class
    });
  } catch (err) {
    console.error('AI analyse error:', err);
    res.status(500).json({ error: 'Failed to analyse with AI: ' + err.message });
  }
};
