import { db, storage } from '../lib/firebase';
import { 
  collection, 
  query, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  deleteDoc, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Busca todas as redes com filtros opcionais
 */
export const fetchNetworks = async (filters = {}) => {
  try {
    let q = query(collection(db, 'networks'), orderBy('name'));
    
    if (filters.disciplerId) {
      q = query(q, where('disciplerId', '==', filters.disciplerId));
    }
    
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Erro ao buscar redes:", error);
    throw error;
  }
};


/**
 * Busca uma única rede pelo ID
 */
export const fetchNetworkById = async (id) => {
  try {
    const snap = await getDoc(doc(db, 'networks', id));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar rede:", error);
    throw error;
  }
};

/**
 * Salva uma rede (Criação ou Atualização)
 */
export const saveNetwork = async (id, data, logoFile) => {
  try {
    let netId = id;
    
    // Se não houver ID, Firestore gerará um aleatório usando doc(collection())
    if (!netId) {
        const docRef = doc(collection(db, 'networks'));
        netId = docRef.id;
    }

    // 2. Upload de Logo se houver novo arquivo
    let logoURL = data.logoURL;
    if (logoFile) {
      const storageRef = ref(storage, `networks/${netId}/logo.jpg`);
      await uploadBytes(storageRef, logoFile);
      logoURL = await getDownloadURL(storageRef);
    }

    // 3. Preparar dados
    const netData = {
      ...data,
      logoURL,
      updatedAt: serverTimestamp()
    };

    if (!id) {
      netData.createdAt = serverTimestamp();
    }

    // 4. Salvar documento
    await setDoc(doc(db, 'networks', netId), netData, { merge: true });

    return { id: netId, ...netData };
  } catch (error) {
    console.error("Erro ao salvar rede:", error);
    throw error;
  }
};

/**
 * Exclui uma rede
 */
export const deleteNetwork = async (id) => {
  try {
    await deleteDoc(doc(db, 'networks', id));
  } catch (error) {
    console.error("Erro ao excluir rede:", error);
    throw error;
  }
};
