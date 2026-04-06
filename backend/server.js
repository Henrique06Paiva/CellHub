import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

// Initialize express
const app = express();

import userRoutes from './routes/userRoutes.js';
import cellRoutes from './routes/cellRoutes.js';
import networkRoutes from './routes/networkRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

// Middlewares
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
