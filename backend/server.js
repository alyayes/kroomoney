import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import transactionRoutes from './routes/transactions.js';
import customerRoutes from './routes/customers.js';
import settingsRoutes from './routes/settings.js';
import invoiceRoutes from './routes/invoices.js';
import receiptRoutes from './routes/receipts.js';
import reminderRoutes from './routes/reminders.js';
import emailTemplateRoutes from './routes/emailTemplates.js';
import { initializeDatabase } from './init-db.js';
import { runReminderCycle } from './services/reminderService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config();

// Ensure storage directories exist
['storage/invoices', 'storage/receipts'].forEach(dir =>
  mkdirSync(join(__dirname, dir), { recursive: true })
);

// Initialize MySQL Tables
initializeDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve generated PDFs from storage directory
app.use('/storage', express.static(join(__dirname, 'storage')));


// ─────────────────────────────────────────────
// Mount API Routes
// ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/email-templates', emailTemplateRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'KroomBox API Server is running smoothly!',
    version: '3.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      transactions: '/api/transactions',
      invoices: '/api/invoices',
      receipts: '/api/receipts',
      reminders: '/api/reminders',
      email_templates: '/api/email-templates',
      customers: '/api/customers',
      settings: '/api/settings',
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.path} tidak ditemukan.` });
});

// ─────────────────────────────────────────────
// Reminder Scheduler — Otomatis setiap 1 jam
// ─────────────────────────────────────────────
const SCHEDULER_INTERVAL_MS = parseInt(process.env.REMINDER_INTERVAL_MINUTES || '60') * 60 * 1000;
let schedulerRunning = false;

async function runScheduler() {
  if (schedulerRunning) return; // Prevent overlap
  schedulerRunning = true;
  try {
    console.log(`⏰ [Scheduler] Running reminder cycle at ${new Date().toLocaleString('id-ID')}`);
    const result = await runReminderCycle();
    console.log(`✅ [Scheduler] Done — ${result.process.sent} sent, ${result.process.failed} failed, ${result.process.skipped} skipped`);
  } catch (err) {
    console.error('❌ [Scheduler] Error:', err.message);
  } finally {
    schedulerRunning = false;
  }
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`==================================================`);
  console.log(`🚀 KroomBox API Server v3.0 running on port ${PORT}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`📋 Endpoints: /api/invoices | /api/receipts | /api/reminders | /api/email-templates`);
  console.log(`==================================================`);

  // Start reminder scheduler after 30s delay (wait for DB init)
  setTimeout(() => {
    console.log(`⏰ [Scheduler] Starting — interval: ${SCHEDULER_INTERVAL_MS / 60000} minutes`);
    setInterval(runScheduler, SCHEDULER_INTERVAL_MS);
  }, 30000);
});
