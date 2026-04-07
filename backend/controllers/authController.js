import { db, auth } from '../config/firebaseConfig.js';
import { sendPasswordResetEmail } from '../config/emailService.js';

/**
 * POST /api/auth/request-password-reset
 *
 * Fluxo completo no backend:
 *  1. Verifica se o email está cadastrado no Firestore (segurança)
 *  2. Gera o link de reset via Firebase Admin SDK (com redirect para /reset-password)
 *  3. Envia o email HTML customizado via Nodemailer + Gmail SMTP
 *  4. O front NÃO precisa mais chamar sendPasswordResetEmail do Firebase Client SDK
 */
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email é obrigatório.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'O email informado não é válido.' });
    }

    // 1. Verifica se existe no Firestore
    const usersSnapshot = await db
      .collection('users')
      .where('email', '==', cleanEmail)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return res.status(404).json({
        error: 'Nenhuma conta encontrada com este e-mail. Contate o administrador da sua célula.',
      });
    }

    // 2. Gera o link de reset apontando para a tela customizada do frontend
    const actionCodeSettings = {
      url: `${process.env.FRONTEND_URL || 'https://cellhub-henrique-dev.web.app'}/reset-password`,
      handleCodeInApp: false, // false = Firebase redireciona para a URL acima com ?oobCode=
    };

    const resetLink = await auth.generatePasswordResetLink(cleanEmail, actionCodeSettings);

    // 3. Envia o email HTML via Nodemailer
    await sendPasswordResetEmail(cleanEmail, resetLink);

    return res.status(200).json({
      success: true,
      message: 'E-mail de redefinição enviado com sucesso.',
    });

  } catch (error) {
    console.error('Erro ao processar reset de senha:', error);

    // Evita enviar detalhes internos ao cliente
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'Nenhuma conta encontrada com este e-mail.' });
    }

    return res.status(500).json({ error: 'Erro interno ao processar a solicitação.' });
  }
};
