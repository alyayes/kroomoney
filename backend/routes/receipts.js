import express from 'express';
import {
  getAllReceipts,
  getReceiptById,
  generateReceipt,
  markReceiptSentWa,
  markReceiptSentEmail,
  deleteReceipt,
  previewReceipt,
  downloadReceiptPdf,
  sendReceiptEmail,
  downloadReceiptPdfByTransactionId,
} from '../controllers/receiptController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken);

router.get('/', getAllReceipts);
router.get('/:id', getReceiptById);
router.get('/:id/preview', previewReceipt);
router.get('/:id/pdf', downloadReceiptPdf);
router.get('/transaction/:transaksiId/pdf', downloadReceiptPdfByTransactionId);
router.post('/generate/:invoiceId', generateReceipt);
router.post('/:id/send-email', sendReceiptEmail);
router.patch('/:id/send-wa', markReceiptSentWa);
router.patch('/:id/send-email', markReceiptSentEmail);
router.delete('/:id', deleteReceipt);

export default router;
