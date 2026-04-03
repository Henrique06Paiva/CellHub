import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  deleteDoc, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';

/**
 * Busca relatórios com base nas permissões e filtros
 */
export const fetchReports = async (userData, filters = {}) => {
  try {
    const role = userData?.role?.toLowerCase();
    const isLeader = role === 'lider' || role === 'leader';
    let q;

    if (role === 'root') {
      q = query(collection(db, 'reports'), orderBy('date', 'desc'));
    } else if (role === 'discipulador' && userData?.networkId) {
      q = query(collection(db, 'reports'), where('networkId', '==', userData.networkId), orderBy('date', 'desc'));
    } else if (isLeader && userData?.cellId) {
      q = query(collection(db, 'reports'), where('cellId', '==', userData.cellId), orderBy('date', 'desc'));
    }

    if (!q) return [];

    // Aplicar filtros adicionais se necessário (ex: cellId específico)
    if (filters.cellId) {
      q = query(q, where('cellId', '==', filters.cellId));
    }

    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Erro ao buscar relatórios:", error);
    throw error;
  }
};

/**
 * Busca um único relatório pelo ID
 */
export const fetchReportById = async (id) => {
  try {
    const snap = await getDoc(doc(db, 'reports', id));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar relatório:", error);
    throw error;
  }
};

/**
 * Salva um relatório (Criação ou Atualização)
 */
export const saveReport = async (id, data) => {
  try {
    let reportId = id;
    if (!reportId) {
      const docRef = doc(collection(db, 'reports'));
      reportId = docRef.id;
    }

    const reportData = {
      ...data,
      updatedAt: serverTimestamp()
    };

    // Remover propriedades undefined que quebram o Firestore
    Object.keys(reportData).forEach(key => {
      if (reportData[key] === undefined) {
        delete reportData[key];
      }
    });

    if (!id) {
      reportData.createdAt = serverTimestamp();
    }

    await setDoc(doc(db, 'reports', reportId), reportData, { merge: true });
    return { id: reportId, ...reportData };
  } catch (error) {
    console.error("Erro ao salvar relatório:", error);
    throw error;
  }
};

/**
 * Exclui um relatório
 */
export const deleteReport = async (id) => {
  try {
    await deleteDoc(doc(db, 'reports', id));
  } catch (error) {
    console.error("Erro ao excluir relatório:", error);
    throw error;
  }
};
