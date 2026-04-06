import { db } from '../config/firebaseConfig.js';

/**
 * Busca todos os usuários com eventuais filtros
 */
export const getUsers = async (req, res) => {
  try {
    if (!db) throw new Error("Database falhou em inicializar.");
    
    // Captura filtros passados na query URL (ex: ?role=lider)
    const { role, networkId } = req.query;

    let usersRef = db.collection('users');
    let query = usersRef.orderBy('name');

    if (role) {
      if (Array.isArray(role)) {
        query = query.where('role', 'in', role);
      } else {
        query = query.where('role', '==', role);
      }
    }

    if (networkId) {
      query = query.where('networkId', '==', networkId);
    }

    const snapshot = await query.get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return res.status(200).json(users);
  } catch (error) {
    console.error("Erro em getUsers:", error);
    return res.status(500).json({ error: 'Erro Interno ao buscar usuários.' });
  }
};

/**
 * Busca um único usuário pelo ID
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = await db.collection('users').doc(id).get();
    
    if (!docRef.exists) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    
    return res.status(200).json({ id: docRef.id, ...docRef.data() });
  } catch (error) {
    console.error("Erro em getUserById:", error);
    return res.status(500).json({ error: 'Erro Interno ao buscar usuário.' });
  }
};

/**
 * Atualiza um usuário (Apenas admins ou o próprio usuário)
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // NOTA DE SEGURANÇA BÁSICA JWT: req.user tem o dono do Token logado
    // Se quiser isolar quem pode editar, faríamos um check do role aqui.
    
    if(updateData.updatedAt) {
        delete updateData.updatedAt; // Previne spoofing de data, usamos do Firebase Admin
    }

    await db.collection('users').doc(id).update({
      ...updateData,
      updatedAt: new Date() // Node cria a data e manda pro firebase
    });

    return res.status(200).json({ message: 'Usuário atualizado com sucesso.' });
  } catch (error) {
    console.error("Erro em updateUser:", error);
    return res.status(500).json({ error: 'Erro Interno ao atualizar usuário.' });
  }
};

/**
 * Exclui um usuário do sistema
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('users').doc(id).delete();
    
    return res.status(200).json({ message: 'Usuário excluído com sucesso.' });
  } catch (error) {
    console.error("Erro em deleteUser:", error);
    return res.status(500).json({ error: 'Erro Interno ao deletar usuário.' });
  }
};
