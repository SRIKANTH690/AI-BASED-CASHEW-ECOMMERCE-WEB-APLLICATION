require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const http      = require('http');
const { Server } = require('socket.io');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET','POST'] }
});

// ── Middleware ────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static files ──────────────────────────────────────────
// Serve uploaded cashew images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Serve the entire frontend folder
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ── Socket.io — real-time admin notifications ─────────────
io.on('connection', (socket) => {
  socket.on('join_admin', () => socket.join('admin_room'));
});
// Attach io to app so controllers can emit events
app.set('io', io);

// ── API Routes ────────────────────────────────────────────
const authRoutes     = require('./routes/auth');
const farmerRoutes   = require('./routes/farmer');
const adminRoutes    = require('./routes/admin');
const customerRoutes = require('./routes/customer');
const { submitEnquiry } = require('./controllers/enquiryController');

app.use('/api', authRoutes);
app.use('/api/farmer',   farmerRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/customer', customerRoutes);

// Public enquiry submission (no auth needed)
app.post('/api/enquiry', submitEnquiry);

// ── Health check ──────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ── Fallback: serve frontend index.html ───────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  // console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Serving frontend from: ../frontend`);
  console.log(`🤖 AI service expected at: ${process.env.AI_SERVICE_URL}`);
});
