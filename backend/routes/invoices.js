import express from 'express';
import {
  getAllInvoices,
  getInvoiceById,
  generateInvoice,
  updateInvoiceStatus,
  updateInvoice,
  deleteInvoice,
  previewInvoice,
  downloadInvoicePdf,
  sendInvoiceEmail,
  sendInvoiceWa,
  downloadInvoicePdfByTransactionId,
  generatePdfFromData,
  generateReportPdf,
} from '../controllers/invoiceController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken);

router.post('/generate-pdf-from-data', generatePdfFromData);
router.post('/generate-report-pdf', generateReportPdf);
router.get('/', getAllInvoices);
router.get('/:id', getInvoiceById);
router.get('/:id/preview', previewInvoice);
router.get('/:id/pdf', downloadInvoicePdf);
router.get('/transaction/:transaksiId/pdf', downloadInvoicePdfByTransactionId);
router.post('/generate/:transaksiId', generateInvoice);
router.post('/:id/send-email', sendInvoiceEmail);
router.post('/:id/send-wa', sendInvoiceWa);
router.put('/:id', updateInvoice);
router.patch('/:id/status', updateInvoiceStatus);
router.delete('/:id', deleteInvoice);

export default router;
