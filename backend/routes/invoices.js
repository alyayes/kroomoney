import express from 'express';
import {
  getAllInvoices,
  getInvoiceById,
  generateInvoice,
  updateInvoiceStatus,
  updateInvoice,
  deleteInvoice,
} from '../controllers/invoiceController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken);

router.get('/', getAllInvoices);
router.get('/:id', getInvoiceById);
router.post('/generate/:transaksiId', generateInvoice);
router.put('/:id', updateInvoice);
router.patch('/:id/status', updateInvoiceStatus);
router.delete('/:id', deleteInvoice);

export default router;
