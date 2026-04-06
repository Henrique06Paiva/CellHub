import express from 'express';
import { getCells, getCellById, createOrUpdateCell, deleteCell } from '../controllers/cellController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getCells);
router.get('/:id', getCellById);
router.post('/', createOrUpdateCell);
router.put('/:id', createOrUpdateCell);
router.delete('/:id', deleteCell);

export default router;
