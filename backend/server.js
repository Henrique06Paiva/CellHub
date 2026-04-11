import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config();

// Initialize express
const app = express();

// Necessário quando rodando atrás de um reverse proxy (Render, Railway, etc.)
// Sem isso, o express-rate-limit crasheia com ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
app.set('trust proxy', 1);

// Segurança Hardening
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import userRoutes from './routes/userRoutes.js';
import cellRoutes from './routes/cellRoutes.js';
import networkRoutes from './routes/networkRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import authRoutes from './routes/authRoutes.js';

// Middlewares Globais de Segurança (Configurado para permitir Firebase)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "https://*.googleapis.com", "https://*.firebaseio.com", "https://*.firebase.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://*.googleapis.com", "https://*.gstatic.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://*.google.com", "https://*.gstatic.com"],
        frameSrc: ["'self'", "https://*.firebaseapp.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
      },
    },
    crossOriginEmbedderPolicy: false, // Necessário para carregar scripts externos como o Firebase
  })
);

// Rate Limiting (Previne ataques de Força Bruta / Botnets bombardeando a API)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // Limita CADA IP a 200 requisições por janela de 15 min (generoso para uso normal)
  message: { error: 'Muitas requisições feitas por este IP, por favor tente novamente mais tarde.' },
  standardHeaders: true, 
  legacyHeaders: false, 
});
app.use('/api', limiter); // Aplica a limitação apenas nas rotas /api

app.use(cors());
app.use(express.json());

// Apply Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cells', cellRoutes);
app.use('/api/networks', networkRoutes);
app.use('/api/reports', reportRoutes);

// Configuração para servir o Frontend (React) após o build
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({ message: 'Nexo-Hub API is running', status: 'online' });
});

// SPA Fallback: Qualquer rota que não comece com /api deve retornar o index.html do React
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start Server
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`--- NEXO-HUB STARTUP ---`);
  console.log(`Server is healthy and running!`);
  console.log(`- Port: ${PORT}`);
  console.log(`- Host: ${HOST}`);
  console.log(`- Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`-------------------------`);
});
