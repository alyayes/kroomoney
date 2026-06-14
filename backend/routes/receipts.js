import express from 'express';
import {
  getAllReceipts,
  getReceiptById,
  generateReceipt,
  markReceiptSentWa,
  markReceiptSentEmail,
  deleteReceipt,
} from '../controllers/receiptController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken);

router.get('/', getAllReceipts);
router.get('/:id', getReceiptById);
router.post('/generate/:invoiceId', generateReceipt);
router.patch('/:id/send-wa', markReceiptSentWa);
router.patch('/:id/send-email', markReceiptSentEmail);
router.delete('/:id', deleteReceipt);

export default router;
