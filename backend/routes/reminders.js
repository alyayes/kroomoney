import express from 'express';
import {
  runReminders,
  scheduleOnly,
  processOnly,
  getReminderPreview,
  getReminderHistory,
  getReminderJobs,
  sendManual,
  getReminderSettings,
  updateReminderSettings,
  testSmtpConnection,
} from '../controllers/reminderController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken);

// Full cycle
router.post('/run', runReminders);
router.post('/schedule', scheduleOnly);
router.post('/process', processOnly);

// Preview & History
router.get('/preview', getReminderPreview);
router.get('/history', getReminderHistory);
router.get('/jobs', getReminderJobs);

// Manual send
router.post('/send', sendManual);

// Settings & Diagnostics
router.get('/settings', getReminderSettings);
router.put('/settings', updateReminderSettings);
router.post('/test-smtp', testSmtpConnection);

export default router;
