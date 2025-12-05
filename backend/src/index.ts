import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import uploadRoutes from './routes/upload';
import newsRoutes from './routes/news';
import settingsRoutes from './routes/settings';
import businessesRoutes from './routes/businesses';
import packagesRoutes from './routes/packages';
import courtsRoutes from './routes/courts';
import whatsappRoutes from './routes/whatsapp';
import occurrencesRoutes from './routes/occurrences';
import usersRoutes from './routes/users';
import contactsRoutes from './routes/contacts';
import schedulesRoutes from './routes/schedules';
import reservationsRoutes from './routes/reservations';
import { initDatabase } from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true,
}));
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/businesses', businessesRoutes);
app.use('/api/packages', packagesRoutes);
app.use('/api/courts', courtsRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/occurrences', occurrencesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/reservations', reservationsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Initialize database and start server
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 API Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });

export default app;
