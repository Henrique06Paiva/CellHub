import { db, storage } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  orderBy, 
  serverTimestamp, 
  runTransaction 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Busca células baseadas nas permissões do usuário
 */
export const fetchCells = async (userData) => {
  try {
    let q;
    if (userData?.role === 'root') {
      q = query(collection(db, 'cells'), orderBy('name'));
    } else if (userData?.role === 'discipulador' && userData.networkId) {
      q = query(collection(db, 'cells'), where('networkId', '==', userData.networkId), orderBy('name'));
    }

    if (q) {
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return [];
  } catch (error) {
    console.error("Erro ao buscar células:", error);
    throw error;
  }
};

/**
 * Busca uma única célula pelo ID
 */
export const fetchCellById = async (id) => {
  try {
    const snap = await getDoc(doc(db, 'cells', id));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar célula:", error);
    throw error;
  }
};

/**
 * Salva uma célula (Criação ou Atualização)
 * Lida com upload de logo e transação de ID (se novo)
 */
export const saveCell = async (id, data, logoFile) => {
  try {
    let cellId = id;
    
    // 1. Gerar ID se for nova célula
    if (!cellId) {
      const counterRef = doc(db, 'counters', 'cells');
      const nextId = await runTransaction(db, async (t) => {
        const docSnap = await t.get(counterRef);
        const lastId = docSnap.exists() ? docSnap.data().lastId : 0;
        t.set(counterRef, { lastId: lastId + 1 });
        return lastId + 1;
      });
      cellId = `cell_${nextId}`;
    }

    // 2. Upload de Logo se houver novo arquivo
    let logoURL = data.logoURL;
    if (logoFile) {
      const storageRef = ref(storage, `cells/${cellId}/logo.jpg`);
      await uploadBytes(storageRef, logoFile);
      logoURL = await getDownloadURL(storageRef);
    }

    // 3. Preparar dados
    const cellData = {
      ...data,
      logoURL,
      updatedAt: serverTimestamp()
    };

    if (!id) {
      cellData.createdAt = serverTimestamp();
    }

    // 4. Salvar documento
    await setDoc(doc(db, 'cells', cellId), cellData, { merge: true });

    // 5. Vincular ao Líder se existir
    if (data.leaderId) {
      await updateDoc(doc(db, 'users', data.leaderId), {
        role: 'lider',
        cellId: cellId,
        cellName: data.name,
        networkId: data.networkId
      });
    }

    return { id: cellId, ...cellData };
  } catch (error) {
    console.error("Erro ao salvar célula:", error);
    throw error;
  }
};

/**
 * Exclui uma célula
 */
export const deleteCell = async (id) => {
  try {
    await deleteDoc(doc(db, 'cells', id));
  } catch (error) {
    console.error("Erro ao excluir célula:", error);
    throw error;
  }
};
