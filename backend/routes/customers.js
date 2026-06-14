import express from 'express';
import { 
  getAllCustomers, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer 
} from '../controllers/customerController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, getAllCustomers);
router.post('/', verifyToken, createCustomer);
router.put('/:id', verifyToken, updateCustomer);
router.delete('/:id', verifyToken, deleteCustomer);

export default router;
