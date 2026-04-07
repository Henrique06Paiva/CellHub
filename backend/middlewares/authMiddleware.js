import { auth, db } from '../config/firebaseConfig.js';

/**
 * Middleware para Proteger Rotas do Backend.
 * Só deixa passar quem enviar um Bearer Token gerado genuinamente pelo Firebase Auth do Frontend.
 */
export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ error: 'Acesso Negado: Nenhum token de autenticação fornecido.' });
  }

  // Divide pelo espaço em branco (garante não quebrar caso a proxy coloque "bearer" minúsculo)
  const idToken = authHeader.split(' ')[1]?.trim();

  if (!idToken) {
     return res.status(401).json({ error: 'Token formatado incorretamente.' });
  }

  try {
    if (!auth) {
      // Falha do servidor caso o Firebase Admin não esteja online
      return res.status(500).json({ error: 'Erro Interno: Serviço de Autenticação inativo.' });
    }

    // Verifica assinatura e expiração na nuvem do Google
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Busca informações de perfil do Firestore
    let role = 'membro';
    let networkId = null;
    let cellId = null;
    let churchId = null;

    try {
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            role = userData.role || 'membro';
            networkId = userData.networkId || null;
            cellId = userData.cellId || null;
            churchId = userData.churchId || null;
        }
    } catch (err) {
        console.error('Erro ao buscar dados do usuário no Firestore:', err.message);
        // Fallback silencioso para não quebrar login, mas limita permissão
    }

    // Injeta os dados do usuário (uid, email, e PERFIL real) no request para uso nas rotas!
    req.user = {
        ...decodedToken,
        role,
        networkId,
        cellId,
        churchId
    };
    
    next();
  } catch (error) {
    console.error('Tentativa de Acesso Inválida JWT:', error.code || error.message);
    return res.status(403).json({ error: 'Acesso Negado: Token inválido ou expirado.' });
  }
};
