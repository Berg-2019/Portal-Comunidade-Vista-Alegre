import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  proto,
  ConnectionState
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import QRCode from 'qrcode';

export interface BotStatus {
  connected: boolean;
  connecting: boolean;
  qrAvailable: boolean;
  phoneNumber: string | null;
  lastConnected: string | null;
  uptime: number;
}

export interface BotMetrics {
  messagesReceived: number;
  messagesSent: number;
  reservationsProcessed: number;
  occurrencesProcessed: number;
  packagesQueried: number;
  averageResponseTime: number;
  errors: number;
}

type MessageHandler = (msg: proto.IWebMessageInfo, sock: WASocket) => Promise<void>;

export class WhatsAppBot {
  private sock: WASocket | null = null;
  private qrCode: string | null = null;
  private connected: boolean = false;
  private connecting: boolean = false;
  private phoneNumber: string | null = null;
  private lastConnected: Date | null = null;
  private startTime: Date | null = null;
  private messageHandler: MessageHandler | null = null;
  private shouldReconnect: boolean = false; // Controle de reconexão manual

  // Metrics
  private metrics: BotMetrics = {
    messagesReceived: 0,
    messagesSent: 0,
    reservationsProcessed: 0,
    occurrencesProcessed: 0,
    packagesQueried: 0,
    averageResponseTime: 0,
    errors: 0
  };

  private responseTimes: number[] = [];

  async connect(handler: MessageHandler): Promise<void> {
    if (this.connecting) {
      console.log('Bot já está conectando, aguarde...');
      return;
    }
    
    if (this.connected) {
      console.log('Bot já está conectado');
      return;
    }

    this.connecting = true;
    this.shouldReconnect = true; // Só reconecta se connect() foi chamado manualmente
    this.messageHandler = handler;
    this.qrCode = null; // Limpa QR code anterior

    try {
      const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

      const logger = pino({ level: 'silent' });

      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger,
        browser: ['Vista Alegre Bot', 'Chrome', '120.0.0']
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log('📱 QR Code gerado - escaneie para conectar');
          try {
            this.qrCode = await QRCode.toDataURL(qr);
            console.log('✅ QR Code convertido para base64');
          } catch (err) {
            console.error('❌ Erro ao gerar QR Code base64:', err);
          }
        }

        if (connection === 'close') {
          this.connected = false;
          this.connecting = false;
          
          const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
          console.log('🔌 Conexão fechada. Código:', reason);

          if (reason === DisconnectReason.loggedOut) {
            console.log('❌ Bot deslogado pelo usuário');
            this.qrCode = null;
            this.shouldReconnect = false;
          } else if (reason === DisconnectReason.restartRequired) {
            console.log('🔄 Restart necessário');
            if (this.shouldReconnect && handler) {
              setTimeout(() => this.connect(handler), 3000);
            }
          } else if (this.shouldReconnect && handler) {
            // Só reconecta se shouldReconnect está ativo
            console.log('🔄 Tentando reconectar em 5 segundos...');
            setTimeout(() => this.connect(handler), 5000);
          } else {
            console.log('⏹️ Reconexão automática desabilitada');
          }
        } else if (connection === 'open') {
          console.log('✅ Bot conectado com sucesso!');
          this.connected = true;
          this.connecting = false;
          this.qrCode = null; // Limpa QR após conectar
          this.lastConnected = new Date();
          this.startTime = new Date();
          this.phoneNumber = this.sock?.user?.id?.split(':')[0] || null;
          console.log('📞 Número conectado:', this.phoneNumber);
        }
      });

      this.sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const msg of messages) {
          if (!msg.key.fromMe && msg.message) {
            this.metrics.messagesReceived++;
            const startTime = Date.now();

            try {
              if (this.messageHandler && this.sock) {
                await this.messageHandler(msg, this.sock);
              }
              
              const responseTime = Date.now() - startTime;
              this.responseTimes.push(responseTime);
              if (this.responseTimes.length > 100) {
                this.responseTimes.shift();
              }
              this.metrics.averageResponseTime = 
                this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
            } catch (error) {
              console.error('Erro ao processar mensagem:', error);
              this.metrics.errors++;
            }
          }
        }
      });

    } catch (error) {
      this.connecting = false;
      this.shouldReconnect = false;
      console.error('Erro ao conectar:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    console.log('🔌 Desconectando bot...');
    this.shouldReconnect = false; // Desabilita reconexão automática
    
    if (this.sock) {
      try {
        await this.sock.logout();
      } catch (error) {
        console.log('Erro ao fazer logout (pode ser normal se já desconectado):', error);
      }
      this.sock = null;
    }
    
    this.connected = false;
    this.connecting = false;
    this.qrCode = null;
    this.phoneNumber = null;
    this.startTime = null;
    console.log('✅ Bot desconectado');
  }

  getStatus(): BotStatus {
    return {
      connected: this.connected,
      connecting: this.connecting,
      qrAvailable: !!this.qrCode,
      phoneNumber: this.phoneNumber,
      lastConnected: this.lastConnected?.toISOString() || null,
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0
    };
  }

  getQRCode(): string | null {
    return this.qrCode;
  }

  getMetrics(): BotMetrics {
    return { ...this.metrics };
  }

  incrementMetric(metric: keyof BotMetrics): void {
    if (typeof this.metrics[metric] === 'number') {
      (this.metrics[metric] as number)++;
    }
  }

  async sendMessage(jid: string, text: string): Promise<void> {
    if (this.sock && this.connected) {
      await this.sock.sendMessage(jid, { text });
      this.metrics.messagesSent++;
    }
  }

  getSocket(): WASocket | null {
    return this.sock;
  }
}
