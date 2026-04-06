import api from '../api/axios';
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const fetchCells = async (userData) => {
  try {
    const params = {};
    if (userData?.role === 'discipulador' && userData.networkId) {
      params.networkId = userData.networkId;
    }
    // API backend usa auth interceptor, logo a API já sabe o ROLE no token

    const response = await api.get('/cells', { params });
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar células da API:", error);
    throw error;
  }
};

export const fetchCellById = async (id) => {
  try {
    const response = await api.get(`/cells/${id}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    console.error("Erro ao buscar célula da API:", error);
    throw error;
  }
};

export const saveCell = async (id, data, logoFile) => {
  try {
    let logoURL = data.logoURL;
    
    // O Upload do logo continua no front usando o SDK Storage para não sobrecarregar a API Nodes
    // Em arquiteturas enterprise complexas, o front pediria uma "Signed URL" para a Node API e uparia direto no S3/Storage
    if (logoFile) {
        // Geramos um UUID randomico já que o cellId virá da API somente DEPOIS
        // Em um sistema real transacionado, você cria primeiro na API, e dps uparia
        const tempId = id || crypto.randomUUID(); 
        const storageRef = ref(storage, `cells/${tempId}/logo.jpg`);
        await uploadBytes(storageRef, logoFile);
        logoURL = await getDownloadURL(storageRef);
    }
    
    const requestData = { ...data, logoURL };

    let response;
    if (id) {
       response = await api.put(`/cells/${id}`, requestData);
    } else {
       response = await api.post(`/cells`, requestData);
    }
    
    return response.data;
  } catch (error) {
    console.error("Erro ao salvar célula na API:", error);
    throw error;
  }
};

export const deleteCell = async (id) => {
  try {
    const response = await api.delete(`/cells/${id}`);
    return response.data;
  } catch (error) {
    console.error("Erro ao excluir célula na API:", error);
    throw error;
  }
};
