import { auth } from '../config/firebaseConfig.js';

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
    
    // Injeta os dados do usuário (uid, email, etc) no request para uso nas rotas!
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Tentativa de Acesso Inválida JWT:', error.code || error.message);
    return res.status(403).json({ error: 'Acesso Negado: Token inválido ou expirado.' });
  }
};
