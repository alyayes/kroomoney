import express from 'express';
import { 
  register, 
  login, 
  forgotPassword, 
  resetPassword,
  getAllTreasurers,
  updateTreasurerStatus,
  updateTreasurer,
  deleteTreasurer,
  createTreasurerByAdmin
} from '../controllers/authController.js';
import { validateRegister, validateLogin } from '../middleware/validate.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Public auth routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Secured admin treasurer control routes
router.get('/treasurers', verifyToken, getAllTreasurers);
router.post('/treasurers', verifyToken, createTreasurerByAdmin);
router.patch('/treasurers/:id/status', verifyToken, updateTreasurerStatus);
router.put('/treasurers/:id', verifyToken, updateTreasurer);
router.delete('/treasurers/:id', verifyToken, deleteTreasurer);

export default router;
