import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import ApiClientController from '../controllers/apiClientController.js';

const router = express.Router();

// All client management routes require treasurer/admin auth
router.use(verifyToken);

router.get('/', ApiClientController.getAllClients);
router.post('/', ApiClientController.createClient);
router.put('/:id', ApiClientController.updateClient);
router.delete('/:id', ApiClientController.deactivateClient);
router.post('/:id/rotate-keys', ApiClientController.rotateKeys);

export default router;
