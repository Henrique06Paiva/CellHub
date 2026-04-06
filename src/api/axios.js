import axios from 'axios';
import { auth } from '../lib/firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api', // Ajuste para a URL de produção futuramente
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor de Requisição: Anexa o Token do Firebase se o usuário estiver logado
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor de Resposta (opcional) para pegar erros de token expirado
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Token JWT ausente ou expirado.");
      // Lógica extra de logout poderia ir aqui se necessário
    }
    return Promise.reject(error);
  }
);

export default api;
