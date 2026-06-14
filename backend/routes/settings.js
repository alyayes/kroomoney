import express from 'express';
import { 
  getSystemSettings, 
  updateSystemSettings,
  getAiInsights
} from '../controllers/settingsController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, getSystemSettings);
router.post('/', verifyToken, updateSystemSettings);
router.get('/ai-insights', verifyToken, getAiInsights);

export default router;
