import makeWASocket, {
  WASocket,
  proto,
  DisconnectReason,
  useMultiFileAuthState,
  isJidBroadcast,
  isJidStatusBroadcast,
  isJidNewsletter,
  Browsers,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion
} from 'baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import QRCode from 'qrcode';
import NodeCache from 'node-cache';
import fs from 'node:fs';
import path from 'node:path';

import { WAWEB_VERSION, AUTH_FOLDER, MAX_RECONNECT_ATTEMPTS, RECONNECT_DELAY_MS, BOT_NAME } from './config';

// Cache para retry de mensagens (padrão Baileys)
const msgRetryCounterCache = new NodeCache({ stdTTL: 600, checkperiod: 60 });

// Logger silencioso
const logger = pino({ level: 'silent' });

export interface BotStatus {
  connected: boolean;
  connecting: boolean;
  qrAvailable: boolean;
  phoneNumber: string | null;
  lastConnected: string | null;
  uptime: number;
  connectionMethod: 'qr' | 'pairing' | null;
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
  private pairingCode: string | null = null;
  private connected: boolean = false;
  private connecting: boolean = false;
  private phoneNumber: string | null = null;
  private lastConnected: Date | null = null;
  private startTime: Date | null = null;
  private messageHandler: MessageHandler | null = null;
  private connectionMethod: 'qr' | 'pairing' | null = null;
  private pendingPhoneNumber: string | null = null;
  private pairingCodeRequested: boolean = false;

  // Métricas
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

  /**
   * Conectar via Pairing Code (método recomendado)
   */
  async connectWithPairingCode(phoneNumber: string, handler: MessageHandler): Promise<void> {
    if (this.connecting) {
      console.log('⏳ Bot já está conectando, aguarde...');
      return;
    }

    if (this.connected) {
      console.log('✅ Bot já está conectado');
      return;
    }

    console.log(`📱 Iniciando conexão via Pairing Code para: ${phoneNumber}`);

    this.connecting = true;
    this.messageHandler = handler;
    this.connectionMethod = 'pairing';
    this.pendingPhoneNumber = phoneNumber.replace(/\D/g, '');
    this.pairingCodeRequested = false;
    this.qrCode = null;
    this.pairingCode = null;

    await this.createSocket();
  }

  /**
   * Conectar via QR Code
   */
  async connectWithQR(handler: MessageHandler): Promise<void> {
    if (this.connecting) {
      console.log('⏳ Bot já está conectando, aguarde...');
      return;
    }

    if (this.connected) {
      console.log('✅ Bot já está conectado');
      return;
    }

    console.log('📷 Iniciando conexão via QR Code...');

    this.connecting = true;
    this.messageHandler = handler;
    this.connectionMethod = 'qr';
    this.pendingPhoneNumber = null;
    this.pairingCodeRequested = false;
    this.qrCode = null;
    this.pairingCode = null;

    await this.createSocket();
  }

  /**
   * Criar e configurar socket (lógica central)
   */
  private async createSocket(): Promise<void> {
    try {
      const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

      // Configuração do socket seguindo documentação Baileys
      this.sock = makeWASocket({
        version: WAWEB_VERSION,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger)
        },
        logger,
        // Browser config: CRÍTICO para pairing code funcionar
        browser: this.connectionMethod === 'pairing' 
          ? Browsers.ubuntu('Chrome')  // Pairing requer browser válido
          : [BOT_NAME, 'Chrome', '120.0.0'],
        printQRInTerminal: this.connectionMethod === 'qr',
        // Configurações de performance
        defaultQueryTimeoutMs: undefined,
        retryRequestDelayMs: RECONNECT_DELAY_MS,
        connectTimeoutMs: 60_000,
        keepAliveIntervalMs: 30_000,
        maxMsgRetryCount: 5,
        msgRetryCounterCache,
        // Otimizações
        markOnlineOnConnect: false,
        syncFullHistory: false,
        emitOwnEvents: false,
        shouldSyncHistoryMessage: () => false,
        shouldIgnoreJid: (jid: string) =>
          isJidBroadcast(jid) || isJidStatusBroadcast(jid) || isJidNewsletter(jid),
        // getMessage para reenvio de mensagens
        getMessage: async () => undefined
      });

      // Salvar credenciais
      this.sock.ev.on('creds.update', saveCreds);

      // Handler principal de conexão
      this.sock.ev.on('connection.update', async (update) => {
        await this.handleConnectionUpdate(update);
      });

      // Handler de mensagens
      this.sock.ev.on('messages.upsert', async ({ messages }) => {
        await this.handleMessages(messages);
      });

    } catch (error) {
      console.error('❌ Erro ao criar socket:', error);
      this.connecting = false;
      throw error;
    }
  }

  /**
   * Handler de conexão (baseado na documentação oficial Baileys)
   */
  private async handleConnectionUpdate(update: any): Promise<void> {
    const { connection, lastDisconnect, qr } = update;

    // === PAIRING CODE: Solicitar quando estiver "connecting" ===
    if (this.connectionMethod === 'pairing' && 
        this.pendingPhoneNumber && 
        !this.pairingCodeRequested &&
        (connection === 'connecting' || qr)) {
      
      this.pairingCodeRequested = true;
      console.log(`📱 Solicitando código de pareamento para: ${this.pendingPhoneNumber}`);
      
      try {
        const code = await this.sock!.requestPairingCode(this.pendingPhoneNumber);
        this.pairingCode = code;
        console.log(`✅ Código de pareamento gerado: ${code}`);
      } catch (err: any) {
        console.error('❌ Erro ao solicitar código de pareamento:', err.message);
        this.pairingCode = null;
      }
    }

    // === QR CODE ===
    if (qr && this.connectionMethod === 'qr') {
      console.log('📱 QR Code gerado');
      try {
        this.qrCode = await QRCode.toDataURL(qr);
      } catch (err) {
        console.error('❌ Erro ao gerar QR Code base64:', err);
      }
    }

    // === CONEXÃO FECHADA ===
    if (connection === 'close') {
      this.connected = false;
      this.connecting = false;

      const error = lastDisconnect?.error as Boom | undefined;
      const statusCode = error?.output?.statusCode;
      const errorMessage = (lastDisconnect?.error as Error)?.message || '';

      console.log(`🔌 Conexão fechada. Código: ${statusCode}, Mensagem: ${errorMessage}`);

      // Decidir se reconecta baseado no código de erro
      const shouldReconnect = this.shouldReconnectAfterError(statusCode, errorMessage);

      if (shouldReconnect) {
        console.log('🔄 Reconectando...');
        setTimeout(() => {
          if (this.connectionMethod === 'pairing' && this.pendingPhoneNumber) {
            this.pairingCodeRequested = false;
            this.createSocket();
          } else if (this.connectionMethod === 'qr') {
            this.createSocket();
          }
        }, RECONNECT_DELAY_MS);
      } else {
        console.log('⛔ Não reconectar. Limpando estado...');
        this.resetState();
      }
    }

    // === CONEXÃO ABERTA ===
    if (connection === 'open') {
      console.log('✅ Bot conectado com sucesso!');
      this.connected = true;
      this.connecting = false;
      this.qrCode = null;
      this.pairingCode = null;
      this.lastConnected = new Date();
      this.startTime = new Date();
      this.phoneNumber = this.sock?.user?.id?.split(':')[0] || null;
      console.log(`📞 Número conectado: ${this.phoneNumber}`);
    }
  }

  /**
   * Decidir se deve reconectar após erro
   */
  private shouldReconnectAfterError(statusCode: number | undefined, message: string): boolean {
    // Logged out - não reconectar
    if (statusCode === DisconnectReason.loggedOut) {
      console.log('❌ Bot foi deslogado pelo usuário');
      this.clearSessionFiles();
      return false;
    }

    // Bad session - limpar e não reconectar automaticamente
    if (statusCode === DisconnectReason.badSession || statusCode === 401) {
      console.log('🔒 Sessão inválida. Limpando...');
      this.clearSessionFiles();
      return false;
    }

    // Restart required - reconectar imediatamente
    if (statusCode === DisconnectReason.restartRequired || statusCode === 515) {
      console.log('🔄 Reinício requerido pelo WhatsApp');
      return true;
    }

    // Connection replaced - não reconectar
    if (statusCode === DisconnectReason.connectionReplaced) {
      console.log('📱 Conexão substituída por outro dispositivo');
      return false;
    }

    // Timeout ou erro de conexão - reconectar
    if (statusCode === DisconnectReason.timedOut || 
        statusCode === DisconnectReason.connectionClosed ||
        statusCode === DisconnectReason.connectionLost) {
      return true;
    }

    // Por padrão, tentar reconectar para erros desconhecidos
    return true;
  }

  /**
   * Handler de mensagens
   */
  private async handleMessages(messages: proto.IWebMessageInfo[]): Promise<void> {
    for (const msg of messages) {
      if (msg.key && !msg.key.fromMe && msg.message) {
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
          console.error('❌ Erro ao processar mensagem:', error);
          this.metrics.errors++;
        }
      }
    }
  }

  /**
   * Limpar arquivos de sessão
   */
  private clearSessionFiles(): void {
    try {
      const authFolder = path.resolve(process.cwd(), AUTH_FOLDER);
      if (fs.existsSync(authFolder)) {
        fs.rmSync(authFolder, { recursive: true, force: true });
        console.log('🗑️ Arquivos de sessão removidos');
      }
    } catch (error: any) {
      console.error('❌ Erro ao limpar sessão:', error.message);
    }
  }

  /**
   * Resetar estado interno
   */
  private resetState(): void {
    this.connected = false;
    this.connecting = false;
    this.qrCode = null;
    this.pairingCode = null;
    this.phoneNumber = null;
    this.startTime = null;
    this.pairingCodeRequested = false;
  }

  /**
   * Desconectar
   */
  async disconnect(): Promise<void> {
    console.log('🔌 Desconectando bot...');

    if (this.sock) {
      try {
        this.sock.end(undefined);
      } catch (error) {
        // Ignorar erros ao fechar
      }
      this.sock = null;
    }

    this.resetState();
    this.connectionMethod = null;
    this.pendingPhoneNumber = null;
    console.log('✅ Bot desconectado');
  }

  /**
   * Limpar sessão completamente
   */
  async clearSession(): Promise<void> {
    console.log('🗑️ Limpando sessão do bot...');

    // Fechar socket primeiro
    if (this.sock) {
      try {
        this.sock.end(undefined);
      } catch (error) {
        // Ignorar
      }
      this.sock = null;
    }

    // Aguardar liberação de arquivos
    await new Promise(r => setTimeout(r, 1000));

    // Limpar arquivos
    this.clearSessionFiles();

    // Resetar estado
    this.resetState();
    this.connectionMethod = null;
    this.pendingPhoneNumber = null;
    this.lastConnected = null;
    this.metrics = {
      messagesReceived: 0,
      messagesSent: 0,
      reservationsProcessed: 0,
      occurrencesProcessed: 0,
      packagesQueried: 0,
      averageResponseTime: 0,
      errors: 0
    };
    this.responseTimes = [];

    console.log('✅ Sessão limpa. Clique em Conectar para gerar novo código.');
  }

  /**
   * Método de conexão padrão (QR Code)
   */
  async connect(handler: MessageHandler): Promise<void> {
    return this.connectWithQR(handler);
  }

  // === GETTERS ===

  getStatus(): BotStatus {
    return {
      connected: this.connected,
      connecting: this.connecting,
      qrAvailable: !!this.qrCode,
      phoneNumber: this.phoneNumber,
      lastConnected: this.lastConnected?.toISOString() || null,
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
      connectionMethod: this.connectionMethod
    };
  }

  getQRCode(): string | null {
    return this.qrCode;
  }

  getPairingCode(): string | null {
    return this.pairingCode;
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

  getBadMacStats(): object {
    return {
      note: 'Bad MAC handling integrado na lógica de reconexão'
    };
  }
}
