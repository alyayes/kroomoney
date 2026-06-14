import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import transactionRoutes from './routes/transactions.js';
import customerRoutes from './routes/customers.js';
import settingsRoutes from './routes/settings.js';
import { initializeDatabase } from './init-db.js';

// Load environment variables
dotenv.config();

// Initialize MySQL Tables
initializeDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for client-server cross-origin communication
app.use(cors({
  origin: '*', // Allow all origins for simplicity in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Express built-in body parsing middlewares (specifically support large base64 signatures)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'KroomBox API Server is running smoothly!',
    timestamp: new Date().toISOString()
  });
});

// Start listening
app.listen(PORT, '0.0.0.0', () => {
  console.log(`==================================================`);
  console.log(`🚀 KroomBox Backend Server running on port ${PORT}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`==================================================`);
});
