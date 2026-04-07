import { db, auth } from '../config/firebaseConfig.js';
// No Node.js precisamos do admin storage também, mas assumindo upload pelo client (Signed URLs)
// ou vamos deixar o front fazer o upload e passar a LogoURL para podermos isolar complexidade agora,
// embora em Enterprise o backend fizesse. Como é SaaS, vamos salvar a URL enviada pelo front.

export const getCells = async (req, res) => {
  try {
    const { role, networkId, cellId } = req.user;
    const userRole = role || 'membro';
    const isLeader = userRole === 'lider' || userRole === 'leader';
    const userNetworkId = networkId;
    const userCellId = cellId;

    let q = db.collection('cells').orderBy('name');

    if (userRole === 'root') {
      // root traz todas
    } else if (userRole === 'discipulador' && userNetworkId) {
       q = q.where('networkId', '==', userNetworkId);
    } else if (isLeader && userCellId) {
       // lider virtualmente não precisaria ver outras células, ou talvez dependa da regra de negócio
       // vamos trazer só a dele
       q = q.where('__name__', '==', userCellId);
    } else {
       // membro não vê lista inteira de células ou não tem acesso 
       return res.status(403).json({ error: 'Acesso negado às células.' });
    }

    const snapshot = await q.get();
    const cells = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return res.status(200).json(cells);
  } catch (error) {
    console.error("Erro em getCells:", error);
    return res.status(500).json({ error: 'Erro Interno ao buscar células.' });
  }
};

export const getCellById = async (req, res) => {
    try {
      const { id } = req.params;
      const { role, networkId, cellId } = req.user;
      
      const docRef = await db.collection('cells').doc(id).get();
      
      if (!docRef.exists) {
        return res.status(404).json({ error: 'Célula não encontrada.' });
      }

      const cellData = { id: docRef.id, ...docRef.data() };

      // RBAC: Verificação se tem acesso
      const userRole = role || 'membro';
      const isLeader = userRole === 'lider' || userRole === 'leader';

      if (userRole === 'root') {
        // Ok
      } else if (userRole === 'discipulador') {
         if (networkId && cellData.networkId !== networkId) {
             console.warn(`Discipulador da rede ${networkId} tentou acessar célula da rede ${cellData.networkId}`);
             return res.status(403).json({ error: 'Acesso negado a esta célula.' });
         }
      } else if (isLeader) {
         if (cellId && cellData.id !== cellId) {
             return res.status(403).json({ error: 'Acesso negado a esta célula.' });
         }
      } else {
         return res.status(403).json({ error: 'Privilégios insuficientes.' });
      }
      
      return res.status(200).json(cellData);
    } catch (error) {
      console.error("Erro em getCellById:", error);
      return res.status(500).json({ error: 'Erro Interno.' });
    }
};

export const createOrUpdateCell = async (req, res) => {
    try {
      const { id } = req.params; // string ou undefined
      const data = req.body;
      
      let cellId = id && id !== 'new' ? id : null;
      
      if (!cellId) {
         // Transacionar contadores via backend de forma segura
         const counterRef = db.collection('counters').doc('cells');
         const nextId = await db.runTransaction(async (t) => {
           const docSnap = await t.get(counterRef);
           const lastId = docSnap.exists ? docSnap.data().lastId : 0;
           t.set(counterRef, { lastId: lastId + 1 });
           return lastId + 1;
         });
         cellId = `cell_${nextId}`;
         data.createdAt = new Date();
      }

      data.updatedAt = new Date();

      await db.collection('cells').doc(cellId).set(data, { merge: true });

      // Atualiza líder se presente (Cuidado: num SaaS real o cascade update deve ser seguro)
      if (data.leaderId) {
         await db.collection('users').doc(data.leaderId).update({
           role: 'lider',
           cellId: cellId,
           cellName: data.name,
           networkId: data.networkId || null
         });
      }

      return res.status(200).json({ id: cellId, ...data });
    } catch (error) {
      console.error("Erro em createOrUpdateCell:", error);
      return res.status(500).json({ error: 'Erro ao salvar célula.' });
    }
};

export const deleteCell = async (req, res) => {
    try {
      const { id } = req.params;
      await db.collection('cells').doc(id).delete();
      
      return res.status(200).json({ message: 'Célula excluída com sucesso.' });
    } catch (error) {
      console.error("Erro em deleteCell:", error);
      return res.status(500).json({ error: 'Erro ao deletar.' });
    }
};
