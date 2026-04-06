import { db } from '../config/firebaseConfig.js';

export const getReports = async (req, res) => {
  try {
    const { role, networkId, cellId } = req.user; 
    // Assumindo que num SaaS essas informações vêm injetadas no Custom Token (Claims)
    // ou passaremos nos headers/queries. Vamos pegar via query params + token fallback
    
    const userRole = req.query.role || role || 'root';
    const isLeader = userRole === 'lider' || userRole === 'leader';
    const userNetworkId = req.query.networkId || networkId;
    const userCellId = req.query.cellId || cellId;

    let q = db.collection('reports').orderBy('date', 'desc');

    if (userRole === 'root') {
      // traz todos
    } else if (userRole === 'discipulador' && userNetworkId) {
      q = q.where('networkId', '==', userNetworkId);
    } else if (isLeader && userCellId) {
      q = q.where('cellId', '==', userCellId);
    } else {
      return res.status(403).json({ error: 'Acesso negado ou credenciais incompletas.' });
    }

    if (req.query.targetCellId) {
      q = q.where('cellId', '==', req.query.targetCellId);
    }

    const snapshot = await q.get();
    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return res.status(200).json(reports);
  } catch (error) {
    console.error("Erro em getReports:", error);
    return res.status(500).json({ error: 'Erro ao buscar relatórios.' });
  }
};

export const getReportById = async (req, res) => {
    try {
      const { id } = req.params;
      const docRef = await db.collection('reports').doc(id).get();
      
      if (!docRef.exists) {
        return res.status(404).json({ error: 'Relatório não encontrado.' });
      }
      
      return res.status(200).json({ id: docRef.id, ...docRef.data() });
    } catch (error) {
      console.error("Erro em getReportById:", error);
      return res.status(500).json({ error: 'Erro Interno.' });
    }
};

export const createOrUpdateReport = async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      
      let reportId = id && id !== 'new' ? id : null;
      
      if (!reportId) {
          const docRef = db.collection('reports').doc();
          reportId = docRef.id;
          data.createdAt = new Date();
      }

      data.updatedAt = new Date();

      // Limpeza de undefined - Node Firestore admin SDK não suporta undefined
      Object.keys(data).forEach(key => {
        if (data[key] === undefined) {
          delete data[key];
        }
      });

      await db.collection('reports').doc(reportId).set(data, { merge: true });

      return res.status(200).json({ id: reportId, ...data });
    } catch (error) {
      console.error("Erro em createOrUpdateReport:", error);
      return res.status(500).json({ error: 'Erro ao salvar relatório.' });
    }
};

export const deleteReport = async (req, res) => {
    try {
      const { id } = req.params;
      await db.collection('reports').doc(id).delete();
      
      return res.status(200).json({ message: 'Relatório excluído com sucesso.' });
    } catch (error) {
      console.error("Erro em deleteReport:", error);
      return res.status(500).json({ error: 'Erro ao deletar.' });
    }
};
