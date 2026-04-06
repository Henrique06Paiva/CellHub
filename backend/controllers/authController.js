import { db, auth } from '../config/firebaseConfig.js';

/**
 * POST /api/auth/request-password-reset
 * Verifica se o email está cadastrado no Firestore ANTES de enviar o email de reset.
 * Isso previne a criação de contas fantasma via sendPasswordResetEmail do Firebase.
 */
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email é obrigatório.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Valida formato básico do email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'O email informado não é válido.' });
    }

    // Verifica se existe algum documento na coleção 'users' com este email
    const usersSnapshot = await db
      .collection('users')
      .where('email', '==', cleanEmail)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      // Não revela se o email existe ou não por segurança contra enumeração,
      // mas como é um sistema interno com cadastro controlado, podemos informar.
      return res.status(404).json({ 
        error: 'Nenhuma conta encontrada com este e-mail. Contate o administrador da sua célula.' 
      });
    }

    // Email está cadastrado no sistema — envia o reset via Firebase Auth
    const resetLink = await auth.generatePasswordResetLink(cleanEmail);
    
    // O Firebase Admin SDK generatePasswordResetLink só gera o link,
    // mas como o sendPasswordResetEmail do client-side envia o email automaticamente,
    // vamos usar o Firebase Auth do Admin para gerar e enviar o email
    // Usamos o método do client SDK em vez disso — retornamos sucesso e o front envia
    return res.status(200).json({ 
      success: true, 
      message: 'Email verificado. Prosseguindo com o reset.' 
    });

  } catch (error) {
    console.error('Erro ao processar reset de senha:', error);
    return res.status(500).json({ error: 'Erro interno ao processar a solicitação.' });
  }
};
