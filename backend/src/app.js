const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const documentRoutes = require('./routes/documentRoutes');
const mentorRoutes = require('./routes/mentorRoutes');
const hodRoutes = require('./routes/hodRoutes');
const cdcRoutes = require('./routes/cdcRoutes');
const teamRoutes = require('./routes/teamRoutes');

const app = express();

// Security Middlewares
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5000',
  'https://projectflow-auth.vercel.app',
  'https://projectflow-portal.vercel.app',
  'https://projectflow-admin.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
});
app.use('/api', limiter);

// Serve uploaded files as static assets
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Health check route
app.get('/api/health', async (req, res) => {
  const db = require('./config/db');
  const isDbConnected = await db.checkConnection();
  res.json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime(),
    database: isDbConnected ? 'CONNECTED' : 'DISCONNECTED'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/cdc', cdcRoutes);
app.use('/api/team', teamRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'ProjectFlow Edu API is running ✅', version: '2.0.0' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message,
  });
});

module.exports = app;
