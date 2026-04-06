import express from 'express';
import { requestPasswordReset } from '../controllers/authController.js';

const router = express.Router();

// Rota PÚBLICA (sem verifyToken) — mas protegida por rate-limit global
router.post('/request-password-reset', requestPasswordReset);

export default router;
