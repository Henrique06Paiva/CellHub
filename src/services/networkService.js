import api from '../api/axios';
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const fetchNetworks = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.disciplerId) params.append('disciplerId', filters.disciplerId);

    const response = await api.get('/networks', { params });
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar redes da API:", error);
    throw error;
  }
};

export const fetchNetworkById = async (id) => {
  try {
    const response = await api.get(`/networks/${id}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    console.error("Erro ao buscar rede da API:", error);
    throw error;
  }
};

export const saveNetwork = async (id, data, logoFile) => {
  try {
    let logoURL = data.logoURL;
    
    // Upload frontend-side architecture just for binary storage mapping
    if (logoFile) {
        const tempId = id || crypto.randomUUID(); 
        const storageRef = ref(storage, `networks/${tempId}/logo.jpg`);
        await uploadBytes(storageRef, logoFile);
        logoURL = await getDownloadURL(storageRef);
    }
    
    const requestData = { ...data, logoURL };

    let response;
    if (id) {
       response = await api.put(`/networks/${id}`, requestData);
    } else {
       response = await api.post(`/networks`, requestData);
    }
    
    return response.data;
  } catch (error) {
    console.error("Erro ao salvar rede na API:", error);
    throw error;
  }
};

export const deleteNetwork = async (id) => {
  try {
    const response = await api.delete(`/networks/${id}`);
    return response.data;
  } catch (error) {
    console.error("Erro ao excluir rede na API:", error);
    throw error;
  }
};
