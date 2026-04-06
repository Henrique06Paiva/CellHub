import { db } from '../config/firebaseConfig.js';

export const getNetworks = async (req, res) => {
  try {
    const { disciplerId } = req.query;

    let q = db.collection('networks').orderBy('name');

    if (disciplerId) {
      q = q.where('disciplerId', '==', disciplerId);
    }

    const snapshot = await q.get();
    const networks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return res.status(200).json(networks);
  } catch (error) {
    console.error("Erro em getNetworks:", error);
    return res.status(500).json({ error: 'Erro ao buscar redes.' });
  }
};

export const getNetworkById = async (req, res) => {
    try {
      const { id } = req.params;
      const docRef = await db.collection('networks').doc(id).get();
      
      if (!docRef.exists) {
        return res.status(404).json({ error: 'Rede não encontrada.' });
      }
      
      return res.status(200).json({ id: docRef.id, ...docRef.data() });
    } catch (error) {
      console.error("Erro em getNetworkById:", error);
      return res.status(500).json({ error: 'Erro Interno.' });
    }
};

export const createOrUpdateNetwork = async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      
      let netId = id && id !== 'new' ? id : null;
      
      if (!netId) {
          const docRef = db.collection('networks').doc();
          netId = docRef.id;
          data.createdAt = new Date();
      }

      data.updatedAt = new Date();

      await db.collection('networks').doc(netId).set(data, { merge: true });

      return res.status(200).json({ id: netId, ...data });
    } catch (error) {
      console.error("Erro em createOrUpdateNetwork:", error);
      return res.status(500).json({ error: 'Erro ao salvar rede.' });
    }
};

export const deleteNetwork = async (req, res) => {
    try {
      const { id } = req.params;
      await db.collection('networks').doc(id).delete();
      
      return res.status(200).json({ message: 'Rede excluída com sucesso.' });
    } catch (error) {
      console.error("Erro em deleteNetwork:", error);
      return res.status(500).json({ error: 'Erro ao deletar.' });
    }
};
