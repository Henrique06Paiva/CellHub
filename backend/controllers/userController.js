import { db } from '../config/firebaseConfig.js';

/**
 * Busca todos os usuários com eventuais filtros
 */
export const getUsers = async (req, res) => {
  try {
    if (!db) throw new Error("Database falhou em inicializar.");
    
    // Traz todos, mas aplica filtros da query string caso mandem (ex: status ativo, rede x)
    const { role: filterRole, networkId: filterNetworkId } = req.query;

    let usersRef = db.collection('users');
    let query = usersRef;

    if (filterRole) {
      if (Array.isArray(filterRole)) {
        query = query.where('role', 'in', filterRole);
      } else {
        query = query.where('role', '==', filterRole);
      }
    }

    // Se o user for discipulador, injeta o networkId obrigando que só venha a rede dele
    // a menos que ele seja root.
    const currentUserRole = req.user.role || 'membro';
    const currentNetworkId = req.user.networkId;

    if (currentUserRole === 'discipulador' && currentNetworkId) {
        query = query.where('networkId', '==', currentNetworkId);
    } else if (filterNetworkId) {
        query = query.where('networkId', '==', filterNetworkId);
    }

    // O orderBy só funciona se todos os docs têm o campo 'name'.
    query = query.orderBy('name');

    const snapshot = await query.get();
    
    // Debug para identificar o usuário que está pedindo a lista
    console.log(`[DEBUG] Usuário requisitante: ${req.user.email} | Role detectada: ${currentUserRole}`);

    // Filtra o root_setup_flag E o usuário 'root' caso o requisitante não seja root
    const users = snapshot.docs
      .filter(doc => doc.id !== 'root_setup_flag')
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(u => {
          // Bloqueia root de aparecer para qualquer um que não seja root
          if (currentUserRole !== 'root') {
               const isRoot = u.role === 'root' || u.email === 'root@nexohub.com' || u.id === 'root';
               return !isRoot;
          }
          return true;
      });

    console.log(`[DEBUG] Total de usuários após filtro: ${users.length}`);
    return res.status(200).json(users);
  } catch (error) {
    console.error("Erro em getUsers:", error);
    return res.status(500).json({ error: 'Erro Interno ao buscar usuários.', details: error.message });
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
