import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WhatsAppBot } from './bot';
import { MessageHandler } from './handlers/messageHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const API_URL = process.env.API_URL || 'http://localhost:3001';

// Middleware de segurança e configuração
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Middleware de tratamento de erros global
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : 'unknown'
  });
});

// Initialize bot
const bot = new WhatsAppBot();
const messageHandler = new MessageHandler(API_URL);

// Bot status endpoint
app.get('/api/bot/status', (req, res) => {
  const status = bot.getStatus();
  res.json(status);
});

// Connect bot (generate QR)
app.post('/api/bot/connect', async (req, res) => {
  try {
    await bot.connect(messageHandler.handleMessage.bind(messageHandler));
    res.json({ success: true, message: 'Iniciando conexão...' });
  } catch (error: any) {
    console.error('Erro ao conectar bot:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao conectar bot.',
      error: error?.message || 'unknown'
    });
  }
});

// Disconnect bot
app.post('/api/bot/disconnect', async (req, res) => {
  try {
    await bot.disconnect();
    res.json({ success: true, message: 'Bot desconectado' });
  } catch (error: any) {
    console.error('Erro ao desconectar bot:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao desconectar bot.',
      error: error?.message || 'unknown'
    });
  }
});

// Clear session (force new QR)
app.post('/api/bot/clear-session', async (req, res) => {
  try {
    await bot.clearSession();
    res.json({
      success: true,
      message: 'Sessão limpa. Clique em Conectar para gerar novo QR.'
    });
  } catch (error: any) {
    console.error('Erro ao limpar sessão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao limpar sessão do bot.',
      error: error?.message || 'unknown'
    });
  }
});

// Get QR Code
app.get('/api/bot/qr', (req, res) => {
  const qr = bot.getQRCode();
  if (qr) {
    res.json({ qr });
  } else {
    res.status(404).json({ error: 'QR Code não disponível' });
  }
});

// Get bot metrics
app.get('/api/bot/metrics', (req, res) => {
  const metrics = bot.getMetrics();
  res.json(metrics);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'whatsapp-bot' });
});

app.listen(PORT, () => {
  console.log(`🤖 WhatsApp Bot API running on port ${PORT}`);
});
