import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WhatsAppBot } from './bot';
import { MessageHandler } from './handlers/messageHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const API_URL = process.env.API_URL || 'http://localhost:3001';

app.use(cors());
app.use(express.json());

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
    res.status(500).json({ success: false, error: error.message });
  }
});

// Disconnect bot
app.post('/api/bot/disconnect', async (req, res) => {
  try {
    await bot.disconnect();
    res.json({ success: true, message: 'Bot desconectado' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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
