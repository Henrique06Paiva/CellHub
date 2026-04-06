import express from 'express';
import { getReports, getReportById, createOrUpdateReport, deleteReport } from '../controllers/reportController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getReports);
router.get('/:id', getReportById);
router.post('/', createOrUpdateReport);
router.put('/:id', createOrUpdateReport);
router.delete('/:id', deleteReport);

export default router;
