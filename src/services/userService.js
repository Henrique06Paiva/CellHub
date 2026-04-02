import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc,
  deleteDoc,
  onSnapshot,
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';

/**
 * Busca usuários com filtros opcionais
 */
export const fetchUsers = async (filters = {}) => {
  try {
    let q = query(collection(db, 'users'), orderBy('name'));

    if (filters.role) {
      if (Array.isArray(filters.role)) {
        q = query(collection(db, 'users'), where('role', 'in', filters.role), orderBy('name'));
      } else {
        q = query(collection(db, 'users'), where('role', '==', filters.role), orderBy('name'));
      }
    }

    if (filters.networkId) {
      q = query(q, where('networkId', '==', filters.networkId));
    }

    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    throw error;
  }
};

/**
 * Busca um único usuário pelo ID
 */
export const fetchUserById = async (id) => {
  try {
    const snap = await getDoc(doc(db, 'users', id));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    throw error;
  }
};

/**
 * Atualiza um usuário
 */
export const updateUser = async (id, data) => {
  try {
    await updateDoc(doc(db, 'users', id), {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    throw error;
  }
};

/**
 * Exclui um usuário
 */
export const deleteUser = async (id) => {
  try {
    await deleteDoc(doc(db, 'users', id));
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    throw error;
  }
};

/**
 * Inscreve-se para atualizações em tempo real dos usuários
 */
export const subscribeUsers = (callback) => {
  const q = query(collection(db, 'users'), orderBy('name'));
  return onSnapshot(q, (snapshot) => {
    const usersData = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    callback(usersData);
  }, (error) => {
    console.error("Erro na inscrição de usuários:", error);
  });
};

