import express from 'express';
import { verifyApiToken, verifySignature, logApiRequest } from '../middleware/apiAuth.js';
import { apiRateLimit } from '../middleware/apiRateLimit.js';

// Controllers
import AuthApiController from '../controllers/api/v1/authApiController.js';
import CustomerSyncController from '../controllers/api/v1/customerSyncController.js';
import TransactionSyncController from '../controllers/api/v1/transactionSyncController.js';
import PaymentApiController from '../controllers/api/v1/paymentApiController.js';
import InvoiceApiController from '../controllers/api/v1/invoiceApiController.js';
import ReceiptApiController from '../controllers/api/v1/receiptApiController.js';

const router = express.Router();

// 1. Auth Endpoint (Public, no auth/rate limit logging)
router.post('/auth/token', AuthApiController.getToken);

// Apply API Key verification, Rate Limit, and Request Log to all following endpoints
router.use(verifyApiToken);
router.use(apiRateLimit);
router.use(logApiRequest);

// 2. Customer Sync Routes
router.post('/customers/sync', verifySignature, CustomerSyncController.syncCustomer);
router.get('/customers/:external_customer_id', CustomerSyncController.getCustomer);

// 3. Transaction Sync Routes
router.post('/transactions/sync', verifySignature, TransactionSyncController.syncTransaction);
router.get('/transactions', TransactionSyncController.getTransactions);
router.get('/transactions/:external_transaction_id', TransactionSyncController.getTransaction);

// 4. Payment Trigger/Management Routes
router.post('/payments/verify', verifySignature, PaymentApiController.verifyPayment);
router.post('/payments/reject', verifySignature, PaymentApiController.rejectPayment);

// 5. Invoice Management Routes
router.post('/invoices/generate', verifySignature, InvoiceApiController.generateInvoice);
router.get('/invoices/:external_transaction_id', InvoiceApiController.getInvoice);
router.post('/invoices/send', verifySignature, InvoiceApiController.sendInvoiceEmail);

// 6. Receipt Management Routes
router.post('/receipts/generate', verifySignature, ReceiptApiController.generateReceipt);
router.get('/receipts/:external_transaction_id', ReceiptApiController.getReceipt);

export default router;
