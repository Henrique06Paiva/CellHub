import api from '../api/axios';
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Fallback para crypto.randomUUID (compatibilidade com browsers mais antigos)
const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: gera um UUID v4 manualmente
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// ============================================================================
// CRUD de Eventos
// ============================================================================

export const fetchEvents = async (filters = {}) => {
  try {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.type) params.type = filters.type;

    const response = await api.get('/events', { params });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    throw error;
  }
};

export const fetchEventById = async (id) => {
  try {
    const response = await api.get(`/events/${id}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    console.error('Erro ao buscar evento:', error);
    throw error;
  }
};

export const saveEvent = async (id, data, bannerFile) => {
  try {
    let bannerURL = data.bannerURL;

    // Upload do banner via Firebase Storage SDK (mesmo padrão do cellService)
    if (bannerFile) {
      const tempId = id || generateId();
      const storageRef = ref(storage, `events/${tempId}/banner.jpg`);
      await uploadBytes(storageRef, bannerFile);
      bannerURL = await getDownloadURL(storageRef);
    }

    const requestData = { ...data, bannerURL };

    let response;
    if (id) {
      response = await api.put(`/events/${id}`, requestData);
    } else {
      response = await api.post('/events', requestData);
    }

    return response.data;
  } catch (error) {
    console.error('Erro ao salvar evento:', error);
    throw error;
  }
};

export const deleteEvent = async (id) => {
  try {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao excluir evento:', error);
    throw error;
  }
};

export const updateEventStatus = async (id, status) => {
  try {
    const response = await api.patch(`/events/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    throw error;
  }
};

// ============================================================================
// Inscrições
// ============================================================================

export const registerForEvent = async (eventId) => {
  try {
    const response = await api.post(`/events/${eventId}/register`);
    return response.data;
  } catch (error) {
    console.error('Erro ao se inscrever:', error);
    throw error;
  }
};

export const cancelRegistration = async (eventId) => {
  try {
    const response = await api.delete(`/events/${eventId}/register`);
    return response.data;
  } catch (error) {
    console.error('Erro ao cancelar inscrição:', error);
    throw error;
  }
};

export const fetchRegistrations = async (eventId) => {
  try {
    const response = await api.get(`/events/${eventId}/registrations`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar inscrições:', error);
    throw error;
  }
};

export const exportRegistrations = async (eventId) => {
  try {
    const response = await api.get(`/events/${eventId}/registrations/export`);
    return response.data;
  } catch (error) {
    console.error('Erro ao exportar inscrições:', error);
    throw error;
  }
};

// ============================================================================
// Check-in
// ============================================================================

export const checkinParticipant = async (eventId, regId, token) => {
  try {
    const response = await api.post(`/events/${eventId}/checkin/${regId}`, { token });
    return response.data;
  } catch (error) {
    console.error('Erro ao fazer check-in:', error);
    throw error;
  }
};

// ============================================================================
// Galeria (Mural de Memórias)
// ============================================================================

export const fetchGallery = async (eventId) => {
  try {
    const response = await api.get(`/events/${eventId}/gallery`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar galeria:', error);
    throw error;
  }
};

export const uploadGalleryPhoto = async (eventId, file) => {
  try {
    // Upload para Firebase Storage
    const photoId = generateId();
    const storageRef = ref(storage, `events/${eventId}/gallery/${photoId}.jpg`);
    await uploadBytes(storageRef, file);
    const photoURL = await getDownloadURL(storageRef);

    // Salvar referência no Firestore via API
    const response = await api.post(`/events/${eventId}/gallery`, { photoURL });
    return response.data;
  } catch (error) {
    console.error('Erro ao enviar foto:', error);
    throw error;
  }
};

export const approveGalleryPhoto = async (eventId, photoId) => {
  try {
    const response = await api.patch(`/events/${eventId}/gallery/${photoId}/approve`);
    return response.data;
  } catch (error) {
    console.error('Erro ao aprovar foto:', error);
    throw error;
  }
};

export const deleteGalleryPhoto = async (eventId, photoId) => {
  try {
    const response = await api.delete(`/events/${eventId}/gallery/${photoId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao remover foto:', error);
    throw error;
  }
};
