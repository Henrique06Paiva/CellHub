import express from 'express';
import { getNetworks, getNetworkById, createOrUpdateNetwork, deleteNetwork } from '../controllers/networkController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getNetworks);
router.get('/:id', getNetworkById);
router.post('/', createOrUpdateNetwork);
router.put('/:id', createOrUpdateNetwork);
router.delete('/:id', deleteNetwork);

export default router;
