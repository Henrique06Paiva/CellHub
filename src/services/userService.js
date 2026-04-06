import api from '../api/axios';

/**
 * Busca usuários com filtros opcionais usando a nova API Node.js
 */
export const fetchUsers = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.role) params.append('role', filters.role);
    if (filters.networkId) params.append('networkId', filters.networkId);
    
    // axios serializa params automaticamente se passarmos o objeto
    const response = await api.get('/users', { params: filters });
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar usuários da API:", error);
    throw error;
  }
};

/**
 * Busca um único usuário pelo ID
 */
export const fetchUserById = async (id) => {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    console.error("Erro ao buscar usuário da API:", error);
    throw error;
  }
};

/**
 * Atualiza um usuário (Aviso: Upload de foto agora teria que passar pela API futuramente se houvesse, mas os dados base vão normais)
 */
export const updateUser = async (id, data) => {
  try {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar usuário na API:", error);
    throw error;
  }
};

/**
 * Exclui um usuário
 */
export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error("Erro ao excluir usuário na API:", error);
    throw error;
  }
};

// O suporte a subscribeUsers foi desativado em favor da arquitetura REST-first.
// Telas devem usar polling ou fetch clássico.
export const subscribeUsers = (callback) => {
  console.warn("subscribeUsers (onSnapshot) está obsoleto na arquitetura de API REST. Usando fetch único.");
  fetchUsers().then(data => callback(data)).catch(err => console.error(err));
  return () => {}; // Fake unsubscribe
};
