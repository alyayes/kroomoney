import express from 'express';
import { 
  getAllTransactions, 
  createTransaction, 
  updateTransaction,
  approveTransaction, 
  deleteTransaction,
  getAuditLogs
} from '../controllers/transactionController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken); // Protect all transaction routes

router.get('/', getAllTransactions);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.patch('/:id/approve', approveTransaction);
router.delete('/:id', deleteTransaction);
router.get('/audit-logs', getAuditLogs); // Admin audit logs

export default router;
