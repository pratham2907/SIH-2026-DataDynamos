require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { Server } = require('socket.io');

const { connectDB } = require('./src/config/db');
const { seedDemoData } = require('./src/services/demoService');
const { initSocket } = require('./src/services/socketService');
const apiRoutes = require('./src/routes/api');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  }
});
initSocket(io);

// Security & utility middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for Leaflet, Chart.js, GSAP CDN integration
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve static frontend files with no-cache in dev
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
}));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Mount API routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    system: 'Kisan Procurement Management System (KPMS)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Fallback for SPA routing to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await seedDemoData(false);

    server.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🌾 KISAN PROCUREMENT MANAGEMENT SYSTEM (KPMS)`);
      console.log(`🚀 Production Server running at: http://localhost:${PORT}`);
      console.log(`📡 Socket.IO Real-time Channels Active`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Fatal startup error:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server };
