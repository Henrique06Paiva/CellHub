import { db } from '../config/firebaseConfig.js';
import crypto from 'crypto';

// ============================================================================
// HELPERS
// ============================================================================

const ADMIN_ROLES = ['root', 'discipulador', 'lider', 'leader'];

const isAdminRole = (role) => ADMIN_ROLES.includes(role);

/**
 * Sanitiza uma string: trim + limite de tamanho.
 */
const sanitizeStr = (val, maxLen = 500) => {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
};

/**
 * Valida que o tipo do evento é um valor permitido.
 */
const VALID_TYPES = ['geral', 'rede', 'celula'];
const VALID_STATUSES = ['draft', 'published', 'ongoing', 'finished', 'cancelled'];

/**
 * Deleta documentos em batches paginados (Firestore max 500 ops por batch).
 */
const deleteCollectionInBatches = async (collectionRef, batchSize = 400) => {
  const snapshot = await collectionRef.get();
  if (snapshot.empty) return;

  let batch = db.batch();
  let count = 0;

  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    count++;
    if (count >= batchSize) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
  }
};

/**
 * Filtra eventos com base no papel do usuário (RBAC).
 * - root: vê tudo
 * - discipulador: vê eventos da sua rede + eventos gerais
 * - lider: vê eventos da sua célula + da sua rede + gerais
 * - membro: vê eventos da sua célula + da sua rede + gerais
 */
const buildEventQuery = (baseQuery, user) => {
  const { role, networkId, cellId } = user;

  if (role === 'root') {
    return baseQuery; // Root vê todos
  }

  // Para demais roles, a filtragem será feita em memória pois Firestore
  // não suporta OR queries com campos aninhados em objetos
  return baseQuery;
};

const filterEventsByScope = (events, user) => {
  const { role, networkId, cellId } = user;

  if (role === 'root') return events;

  return events.filter(event => {
    // Eventos gerais são visíveis para todos
    if (event.type === 'geral') return true;

    // Eventos de rede: visíveis para quem pertence à rede
    if (event.type === 'rede' && event.scope?.networkId === networkId) return true;

    // Eventos de célula: visíveis para quem pertence à célula (ou à rede da célula)
    if (event.type === 'celula') {
      if (event.scope?.cellId === cellId) return true;
      // Discipulador vê eventos das células da sua rede
      if (role === 'discipulador' && event.scope?.networkId === networkId) return true;
    }

    return false;
  });
};

// ============================================================================
// CRUD — Eventos
// ============================================================================

/**
 * GET /events
 * Lista eventos com filtros opcionais: ?status=published&type=celula
 */
export const getEvents = async (req, res) => {
  try {
    const { status, type } = req.query;

    let query = db.collection('events').orderBy('date', 'asc');

    // Filtro por status (Firestore query nativa — eficiente)
    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    let events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filtro por tipo (em memória, pois pode combinar com status)
    if (type) {
      events = events.filter(e => e.type === type);
    }

    // Filtro RBAC por escopo
    events = filterEventsByScope(events, req.user);

    // Enriquecer com contagem de inscritos (batch read)
    const enriched = await Promise.all(events.map(async (event) => {
      const regsSnap = await db.collection('events').doc(event.id)
        .collection('registrations').count().get();
      return {
        ...event,
        registrationCount: regsSnap.data().count || 0
      };
    }));

    return res.status(200).json(enriched);
  } catch (error) {
    console.error('Erro em getEvents:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar eventos.' });
  }
};

/**
 * GET /events/:id
 * Detalhes de um evento específico, incluindo contagem de inscritos
 */
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = await db.collection('events').doc(id).get();

    if (!docRef.exists) {
      return res.status(404).json({ error: 'Evento não encontrado.' });
    }

    const event = { id: docRef.id, ...docRef.data() };

    // Verificar se o usuário tem acesso ao evento
    const filtered = filterEventsByScope([event], req.user);
    if (filtered.length === 0) {
      return res.status(403).json({ error: 'Acesso negado a este evento.' });
    }

    // Contagem de inscritos
    const regsSnap = await db.collection('events').doc(id)
      .collection('registrations').count().get();
    event.registrationCount = regsSnap.data().count || 0;

    // Verificar se o usuário atual está inscrito
    const userRegSnap = await db.collection('events').doc(id)
      .collection('registrations')
      .where('userId', '==', req.user.uid)
      .limit(1)
      .get();

    event.currentUserRegistration = userRegSnap.empty ? null : {
      id: userRegSnap.docs[0].id,
      ...userRegSnap.docs[0].data()
    };

    return res.status(200).json(event);
  } catch (error) {
    console.error('Erro em getEventById:', error);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

/**
 * POST /events
 * Criar novo evento (apenas admins)
 */
export const createEvent = async (req, res) => {
  try {
    const { role } = req.user;

    if (!isAdminRole(role)) {
      return res.status(403).json({ error: 'Apenas líderes e acima podem criar eventos.' });
    }

    const data = req.body;

    // Validação básica
    if (!data.title?.trim() || !data.date || !data.type) {
      return res.status(400).json({ error: 'Título, data e tipo são obrigatórios.' });
    }

    // Validar tipo
    if (!VALID_TYPES.includes(data.type)) {
      return res.status(400).json({ error: 'Tipo de evento inválido.' });
    }

    // Validar status inicial
    if (data.status && !['draft', 'published'].includes(data.status)) {
      return res.status(400).json({ error: 'Status inicial deve ser "draft" ou "published".' });
    }

    // Gerar ID sequencial via transação atômica
    const counterRef = db.collection('counters').doc('events');
    const nextId = await db.runTransaction(async (t) => {
      const docSnap = await t.get(counterRef);
      const lastId = docSnap.exists ? docSnap.data().lastId : 0;
      t.set(counterRef, { lastId: lastId + 1 });
      return lastId + 1;
    });

    const eventId = `event_${nextId}`;

    const eventData = {
      title: sanitizeStr(data.title, 200),
      description: sanitizeStr(data.description, 5000),
      bannerURL: sanitizeStr(data.bannerURL, 1000),
      type: data.type, // 'celula' | 'rede' | 'geral'
      scope: {
        cellId: data.scope?.cellId || null,
        cellName: data.scope?.cellName || null,
        networkId: data.scope?.networkId || null,
        networkName: data.scope?.networkName || null,
      },
      location: {
        name: data.location?.name || '',
        lat: data.location?.lat || null,
        lng: data.location?.lng || null,
      },
      date: data.date,
      endDate: data.endDate || null,
      isPaid: data.isPaid || false,
      price: data.isPaid ? (data.price || 0) : 0,
      paymentLink: data.isPaid ? (data.paymentLink || '') : '',
      maxCapacity: data.maxCapacity || null,
      status: data.status || 'draft',
      createdBy: req.user.uid,
      createdByName: req.user.name || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('events').doc(eventId).set(eventData);

    return res.status(201).json({ id: eventId, ...eventData });
  } catch (error) {
    console.error('Erro em createEvent:', error);
    return res.status(500).json({ error: 'Erro ao criar evento.' });
  }
};

/**
 * PUT /events/:id
 * Atualizar evento (criador ou root)
 */
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, uid } = req.user;
    const data = req.body;

    const docRef = await db.collection('events').doc(id).get();

    if (!docRef.exists) {
      return res.status(404).json({ error: 'Evento não encontrado.' });
    }

    const existing = docRef.data();

    // Apenas root ou o criador do evento pode editar
    if (role !== 'root' && existing.createdBy !== uid) {
      return res.status(403).json({ error: 'Apenas o criador ou administrador pode editar este evento.' });
    }

    // Proteger campos que não devem ser alterados via PUT
    // (status muda apenas via PATCH /status)
    const updateData = {
      ...(data.title !== undefined && { title: sanitizeStr(data.title, 200) }),
      ...(data.description !== undefined && { description: sanitizeStr(data.description, 5000) }),
      ...(data.bannerURL !== undefined && { bannerURL: sanitizeStr(data.bannerURL, 1000) }),
      ...(data.type !== undefined && VALID_TYPES.includes(data.type) && { type: data.type }),
      ...(data.scope !== undefined && {
        scope: {
          cellId: data.scope?.cellId || null,
          cellName: data.scope?.cellName || null,
          networkId: data.scope?.networkId || null,
          networkName: data.scope?.networkName || null,
        }
      }),
      ...(data.location !== undefined && {
        location: {
          name: sanitizeStr(data.location?.name, 500),
          lat: data.location?.lat || null,
          lng: data.location?.lng || null,
        }
      }),
      ...(data.date !== undefined && { date: data.date }),
      ...(data.endDate !== undefined && { endDate: data.endDate }),
      ...(data.isPaid !== undefined && { isPaid: !!data.isPaid }),
      ...(data.price !== undefined && { price: Number(data.price) || 0 }),
      ...(data.paymentLink !== undefined && { paymentLink: sanitizeStr(data.paymentLink, 500) }),
      ...(data.maxCapacity !== undefined && { maxCapacity: data.maxCapacity ? Number(data.maxCapacity) : null }),
      updatedAt: new Date(),
    };

    await db.collection('events').doc(id).update(updateData);

    return res.status(200).json({ id, ...existing, ...updateData });
  } catch (error) {
    console.error('Erro em updateEvent:', error);
    return res.status(500).json({ error: 'Erro ao atualizar evento.' });
  }
};

/**
 * DELETE /events/:id
 * Deletar evento (root ou criador)
 */
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, uid } = req.user;

    const docRef = await db.collection('events').doc(id).get();

    if (!docRef.exists) {
      return res.status(404).json({ error: 'Evento não encontrado.' });
    }

    if (role !== 'root' && docRef.data().createdBy !== uid) {
      return res.status(403).json({ error: 'Sem permissão para deletar este evento.' });
    }

    // Deletar subcoleções com batches paginados (limite de 500 ops por batch)
    await deleteCollectionInBatches(
      db.collection('events').doc(id).collection('registrations')
    );
    await deleteCollectionInBatches(
      db.collection('events').doc(id).collection('gallery')
    );

    // Deletar o evento em si
    await db.collection('events').doc(id).delete();

    return res.status(200).json({ message: 'Evento excluído com sucesso.' });
  } catch (error) {
    console.error('Erro em deleteEvent:', error);
    return res.status(500).json({ error: 'Erro ao deletar evento.' });
  }
};

/**
 * PATCH /events/:id/status
 * Alterar status do evento (draft → published → ongoing → finished)
 */
export const updateEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { role, uid } = req.user;

    const validStatuses = ['draft', 'published', 'ongoing', 'finished', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status inválido. Use: ${validStatuses.join(', ')}` });
    }

    const docRef = await db.collection('events').doc(id).get();

    if (!docRef.exists) {
      return res.status(404).json({ error: 'Evento não encontrado.' });
    }

    if (role !== 'root' && docRef.data().createdBy !== uid) {
      return res.status(403).json({ error: 'Sem permissão para alterar o status.' });
    }

    await db.collection('events').doc(id).update({
      status,
      updatedAt: new Date()
    });

    return res.status(200).json({ id, status });
  } catch (error) {
    console.error('Erro em updateEventStatus:', error);
    return res.status(500).json({ error: 'Erro ao atualizar status.' });
  }
};

// ============================================================================
// INSCRIÇÕES
// ============================================================================

/**
 * POST /events/:id/register
 * Inscrever o usuário autenticado no evento
 */
export const registerForEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.user;

    const eventDoc = await db.collection('events').doc(id).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Evento não encontrado.' });
    }

    const event = eventDoc.data();

    // Verificar se evento aceita inscrições
    if (!['published', 'ongoing'].includes(event.status)) {
      return res.status(400).json({ error: 'Este evento não está aberto para inscrições.' });
    }

    // Verificar se já está inscrito
    const existingReg = await db.collection('events').doc(id)
      .collection('registrations')
      .where('userId', '==', uid)
      .limit(1)
      .get();

    if (!existingReg.empty) {
      return res.status(409).json({ error: 'Você já está inscrito neste evento.' });
    }

    // Verificar capacidade máxima
    if (event.maxCapacity) {
      const countSnap = await db.collection('events').doc(id)
        .collection('registrations').count().get();
      const currentCount = countSnap.data().count || 0;

      if (currentCount >= event.maxCapacity) {
        return res.status(400).json({ error: 'Evento lotado. Não há mais vagas disponíveis.' });
      }
    }

    // Buscar dados do usuário para enriquecer a inscrição
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    // Gerar token único para QR Code
    const qrCodeToken = crypto.randomUUID();

    const registration = {
      userId: uid,
      userName: userData.name || req.user.email || 'Desconhecido',
      cellId: userData.cellId || null,
      cellName: userData.cellName || null,
      networkId: userData.networkId || null,
      status: event.isPaid ? 'pending_payment' : 'confirmed',
      paymentConfirmed: !event.isPaid,
      checkedIn: false,
      checkedInAt: null,
      checkedInBy: null,
      qrCodeToken,
      registeredAt: new Date(),
    };

    const regRef = await db.collection('events').doc(id)
      .collection('registrations').add(registration);

    return res.status(201).json({ id: regRef.id, ...registration });
  } catch (error) {
    console.error('Erro em registerForEvent:', error);
    return res.status(500).json({ error: 'Erro ao realizar inscrição.' });
  }
};

/**
 * DELETE /events/:id/register
 * Cancelar inscrição do usuário autenticado
 */
export const cancelRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.user;

    const regsSnap = await db.collection('events').doc(id)
      .collection('registrations')
      .where('userId', '==', uid)
      .limit(1)
      .get();

    if (regsSnap.empty) {
      return res.status(404).json({ error: 'Inscrição não encontrada.' });
    }

    await regsSnap.docs[0].ref.delete();

    return res.status(200).json({ message: 'Inscrição cancelada com sucesso.' });
  } catch (error) {
    console.error('Erro em cancelRegistration:', error);
    return res.status(500).json({ error: 'Erro ao cancelar inscrição.' });
  }
};

/**
 * POST /events/:id/checkin/:regId
 * Fazer check-in de um participante (via QR Code token)
 */
export const checkinParticipant = async (req, res) => {
  try {
    const { id, regId } = req.params;
    const { token } = req.body;
    const { role, uid } = req.user;

    if (!isAdminRole(role)) {
      return res.status(403).json({ error: 'Apenas líderes podem realizar check-in.' });
    }

    const regRef = db.collection('events').doc(id).collection('registrations').doc(regId);
    const regDoc = await regRef.get();

    if (!regDoc.exists) {
      return res.status(404).json({ error: 'Inscrição não encontrada.' });
    }

    const regData = regDoc.data();

    // Validar token do QR Code (obrigatório quando enviado pelo scanner)
    if (token) {
      if (!regData.qrCodeToken || regData.qrCodeToken !== token) {
        return res.status(400).json({ error: 'QR Code inválido.' });
      }
    }

    // Verificar se já fez check-in
    if (regData.checkedIn) {
      return res.status(409).json({
        error: 'Check-in já realizado.',
        checkedInAt: regData.checkedInAt
      });
    }

    await regRef.update({
      checkedIn: true,
      checkedInAt: new Date(),
      checkedInBy: uid,
    });

    return res.status(200).json({
      message: 'Check-in realizado com sucesso!',
      userName: regData.userName,
      checkedInAt: new Date()
    });
  } catch (error) {
    console.error('Erro em checkinParticipant:', error);
    return res.status(500).json({ error: 'Erro ao realizar check-in.' });
  }
};

/**
 * GET /events/:id/registrations
 * Listar inscritos (apenas admins)
 */
export const getRegistrations = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.user;

    if (!isAdminRole(role)) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    const regsSnap = await db.collection('events').doc(id)
      .collection('registrations')
      .orderBy('registeredAt', 'desc')
      .get();

    const registrations = regsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return res.status(200).json(registrations);
  } catch (error) {
    console.error('Erro em getRegistrations:', error);
    return res.status(500).json({ error: 'Erro ao buscar inscrições.' });
  }
};

/**
 * GET /events/:id/registrations/export
 * Exportar lista de inscritos como JSON (frontend converte para PDF/XLSX)
 */
export const exportRegistrations = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.user;

    if (!isAdminRole(role)) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    const eventDoc = await db.collection('events').doc(id).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Evento não encontrado.' });
    }

    const regsSnap = await db.collection('events').doc(id)
      .collection('registrations')
      .orderBy('userName', 'asc')
      .get();

    const registrations = regsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        nome: data.userName,
        celula: data.cellName || '—',
        status: data.status,
        pagamento: data.paymentConfirmed ? 'Confirmado' : 'Pendente',
        checkin: data.checkedIn ? 'Sim' : 'Não',
        checkinHora: data.checkedInAt || null,
        inscricao: data.registeredAt,
      };
    });

    return res.status(200).json({
      event: { id, title: eventDoc.data().title, date: eventDoc.data().date },
      registrations,
      total: registrations.length,
      checkedIn: registrations.filter(r => r.checkin === 'Sim').length,
    });
  } catch (error) {
    console.error('Erro em exportRegistrations:', error);
    return res.status(500).json({ error: 'Erro ao exportar inscrições.' });
  }
};

// ============================================================================
// GALERIA (Mural de Memórias)
// ============================================================================

/**
 * POST /events/:id/gallery
 * Adicionar foto (apenas quem fez check-in, com moderação pendente)
 */
export const addGalleryPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.user;
    const { photoURL } = req.body;

    if (!photoURL) {
      return res.status(400).json({ error: 'URL da foto é obrigatória.' });
    }

    // Verificar se o evento existe e está encerrado
    const eventDoc = await db.collection('events').doc(id).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Evento não encontrado.' });
    }

    // Verificar se o usuário fez check-in
    const regSnap = await db.collection('events').doc(id)
      .collection('registrations')
      .where('userId', '==', uid)
      .where('checkedIn', '==', true)
      .limit(1)
      .get();

    if (regSnap.empty) {
      return res.status(403).json({ error: 'Apenas participantes com check-in podem enviar fotos.' });
    }

    const userDoc = await db.collection('users').doc(uid).get();
    const userName = userDoc.exists ? userDoc.data().name : 'Desconhecido';

    const photo = {
      photoURL,
      uploadedBy: uid,
      uploadedByName: userName,
      approved: false, // Moderação: líder precisa aprovar
      uploadedAt: new Date(),
    };

    const photoRef = await db.collection('events').doc(id)
      .collection('gallery').add(photo);

    return res.status(201).json({ id: photoRef.id, ...photo });
  } catch (error) {
    console.error('Erro em addGalleryPhoto:', error);
    return res.status(500).json({ error: 'Erro ao adicionar foto.' });
  }
};

/**
 * GET /events/:id/gallery
 * Listar fotos do mural (admins veem todas, membros veem apenas aprovadas)
 */
export const getGallery = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.user;

    let query = db.collection('events').doc(id)
      .collection('gallery')
      .orderBy('uploadedAt', 'desc');

    // Membros veem apenas fotos aprovadas
    if (!isAdminRole(role)) {
      query = query.where('approved', '==', true);
    }

    const snap = await query.get();
    const photos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return res.status(200).json(photos);
  } catch (error) {
    console.error('Erro em getGallery:', error);
    return res.status(500).json({ error: 'Erro ao buscar galeria.' });
  }
};

/**
 * PATCH /events/:id/gallery/:photoId/approve
 * Aprovar foto do mural (apenas admins)
 */
export const approveGalleryPhoto = async (req, res) => {
  try {
    const { id, photoId } = req.params;
    const { role } = req.user;

    if (!isAdminRole(role)) {
      return res.status(403).json({ error: 'Apenas líderes podem aprovar fotos.' });
    }

    const photoRef = db.collection('events').doc(id).collection('gallery').doc(photoId);
    const photoDoc = await photoRef.get();

    if (!photoDoc.exists) {
      return res.status(404).json({ error: 'Foto não encontrada.' });
    }

    await photoRef.update({ approved: true });

    return res.status(200).json({ message: 'Foto aprovada.' });
  } catch (error) {
    console.error('Erro em approveGalleryPhoto:', error);
    return res.status(500).json({ error: 'Erro ao aprovar foto.' });
  }
};

/**
 * DELETE /events/:id/gallery/:photoId
 * Remover foto (admin ou quem enviou)
 */
export const deleteGalleryPhoto = async (req, res) => {
  try {
    const { id, photoId } = req.params;
    const { role, uid } = req.user;

    const photoRef = db.collection('events').doc(id).collection('gallery').doc(photoId);
    const photoDoc = await photoRef.get();

    if (!photoDoc.exists) {
      return res.status(404).json({ error: 'Foto não encontrada.' });
    }

    if (!isAdminRole(role) && photoDoc.data().uploadedBy !== uid) {
      return res.status(403).json({ error: 'Sem permissão para remover esta foto.' });
    }

    await photoRef.delete();

    return res.status(200).json({ message: 'Foto removida.' });
  } catch (error) {
    console.error('Erro em deleteGalleryPhoto:', error);
    return res.status(500).json({ error: 'Erro ao remover foto.' });
  }
};
