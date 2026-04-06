import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

// Initialize express
const app = express();

// Segurança Hardening
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import userRoutes from './routes/userRoutes.js';
import cellRoutes from './routes/cellRoutes.js';
import networkRoutes from './routes/networkRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

// Middlewares Globais de Segurança (Helmet OCULTA informações do servidor pra hackers)
app.use(helmet());

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
app.use('/api/users', userRoutes);
app.use('/api/cells', cellRoutes);
app.use('/api/networks', networkRoutes);
app.use('/api/reports', reportRoutes);

// Public Route (Health Check)
app.get('/', (req, res) => {
  res.json({ message: 'Nexo-Hub API is running', status: 'online' });
});

// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is healthy and running on port ${PORT}`);
});
