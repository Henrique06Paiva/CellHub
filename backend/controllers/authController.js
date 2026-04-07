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
    const FALLBACK_URL = 'https://cellhub-henrique-dev.web.app';
    const rawFrontendUrl = (process.env.FRONTEND_URL || '').trim();

    // Valida se a env var é uma URL absoluta válida; caso contrário usa o fallback
    let frontendBase;
    try {
      frontendBase = rawFrontendUrl ? new URL(rawFrontendUrl).origin : FALLBACK_URL;
    } catch {
      console.warn(`⚠️  FRONTEND_URL inválida ("${rawFrontendUrl}"), usando fallback: ${FALLBACK_URL}`);
      frontendBase = FALLBACK_URL;
    }

    const actionCodeSettings = {
      url: `${frontendBase}/reset-password`,
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
    // Log detalhado para diagnóstico nos logs do Render
    console.error('❌ Erro ao processar reset de senha:');
    console.error('  Mensagem:', error.message);
    console.error('  Código:', error.code || '(sem código)');
    console.error('  Stack:', error.stack);

    // Evita enviar detalhes internos ao cliente
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'Nenhuma conta encontrada com este e-mail.' });
    }

    // Identifica problemas de configuração específicos
    if (error.message?.includes('Invalid login') || error.message?.includes('Username and Password')) {
      console.error('  ⚠️  CAUSA PROVÁVEL: GMAIL_USER ou GMAIL_PASS incorretos ou App Password não configurado.');
    }
    if (!auth) {
      console.error('  ⚠️  CAUSA PROVÁVEL: Firebase Admin SDK não inicializado (auth é null). Verifique FIREBASE_SERVICE_ACCOUNT no Render.');
    }

    return res.status(500).json({ error: 'Erro interno ao processar a solicitação.' });
  }
};
