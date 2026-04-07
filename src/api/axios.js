import axios from 'axios';
import { auth } from '../lib/firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000, // 15s timeout para evitar requisições penduradas
});

// Cache simples de token em memória (evita chamar getIdToken() a cada request)
// O token do Firebase tem validade de 1h; cacheamos por 30s para margem de segurança
let tokenCache = { value: null, expiresAt: 0 };

const getCachedToken = async (user) => {
  const now = Date.now();
  if (tokenCache.value && now < tokenCache.expiresAt) {
    return tokenCache.value;
  }
  const token = await user.getIdToken();
  tokenCache = { value: token, expiresAt: now + 30_000 }; // 30s TTL
  return token;
};

// Interceptor de Requisição: Anexa o Token do Firebase se o usuário estiver logado
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  
  if (user) {
    const token = await getCachedToken(user);
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
