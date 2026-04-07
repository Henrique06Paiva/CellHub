import api from '../api/axios';

/**
 * Busca relatórios consolidados no backend
 */
export const fetchReports = async (userData, filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    // A API agora detecta tudo via Firebase Auth (req.user no middleware)
    if (filters.cellId) params.append('targetCellId', filters.cellId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    
    const response = await api.get('/reports', { params });
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar relatórios da API:", error);
    throw error;
  }
};

/**
 * Busca um único relatório pelo ID
 */
export const fetchReportById = async (id) => {
  try {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    console.error("Erro ao buscar relatório da API:", error);
    throw error;
  }
};

/**
 * Salva um relatório
 */
export const saveReport = async (id, data) => {
  try {
    let response;
    
    // A limpeza de undefineds já acontece no front ou no back
    // Axios limpa alguns undefined automáticos em JSON.stringify
    
    if (id) {
       response = await api.put(`/reports/${id}`, data);
    } else {
       response = await api.post(`/reports`, data);
    }
    
    return response.data;
  } catch (error) {
    console.error("Erro ao salvar relatório na API:", error);
    throw error;
  }
};

/**
 * Exclui um relatório
 */
export const deleteReport = async (id) => {
  try {
    const response = await api.delete(`/reports/${id}`);
    return response.data;
  } catch (error) {
    console.error("Erro ao excluir relatório na API:", error);
    throw error;
  }
};
