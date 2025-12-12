import makeWASocket, {
  WASocket,
  proto,
  DisconnectReason,
  useMultiFileAuthState,
  isJidBroadcast,
  isJidStatusBroadcast,
  isJidNewsletter,
  delay
} from 'baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import QRCode from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';
import NodeCache from 'node-cache';

import { WAWEB_VERSION, AUTH_FOLDER, MAX_RECONNECT_ATTEMPTS, RECONNECT_DELAY_MS, BOT_NAME } from './config';
import { badMacHandler } from './utils/badMacHandler';

// Cache para retry de mensagens (igual takeshi-bot)
const msgRetryCounterCache = new NodeCache();

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
  private shouldReconnect: boolean = false;
  private connectionMethod: 'qr' | 'pairing' | null = null;
  private pendingPhoneNumber: string | null = null;
  private pairingInProgress: boolean = false; // Flag para ignorar erros durante pareamento

  // Reconnection control
  private reconnectAttempts: number = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;

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

  /**
   * Configurações comuns do socket (baseado no takeshi-bot)
   */
  private getSocketConfig(state: any, logger: any) {
    return {
      version: WAWEB_VERSION,
      auth: state,
      logger,
      browser: [BOT_NAME, 'Chrome', '120.0.0'] as [string, string, string],
      defaultQueryTimeoutMs: undefined,
      retryRequestDelayMs: RECONNECT_DELAY_MS,
      shouldIgnoreJid: (jid: string) =>
        isJidBroadcast(jid) || isJidStatusBroadcast(jid) || isJidNewsletter(jid),
      connectTimeoutMs: 20_000,
      keepAliveIntervalMs: 30_000,
      maxMsgRetryCount: 5,
      markOnlineOnConnect: false,
      syncFullHistory: false,
      emitOwnEvents: false,
      msgRetryCounterCache,
      shouldSyncHistoryMessage: () => false,
    };
  }

  /**
   * Conectar via Pairing Code (código de 8 dígitos)
   */
  async connectWithPairingCode(phoneNumber: string, handler: MessageHandler): Promise<void> {
    if (this.connecting) {
      console.log('Bot já está conectando, aguarde...');
      return;
    }

    if (this.connected) {
      console.log('Bot já está conectado');
      return;
    }

    this.connecting = true;
    this.shouldReconnect = true;
    this.messageHandler = handler;
    this.connectionMethod = 'pairing';
    this.pendingPhoneNumber = phoneNumber;
    this.qrCode = null;
    this.pairingCode = null;

    console.log(`📱 Iniciando conexão via Pairing Code para: ${phoneNumber}`);

    try {
      const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
      const logger = pino({ level: 'silent' });

      this.sock = makeWASocket({
        ...this.getSocketConfig(state, logger),
        printQRInTerminal: false, // Não mostrar QR no modo pairing
      });

      this.sock.ev.on('creds.update', saveCreds);

      // Solicitar pairing code se não registrado
      if (!this.sock.authState.creds.registered) {
        const cleanNumber = phoneNumber.replace(/\D/g, '');
        console.log(`📱 Aguardando socket ficar pronto...`);
        await delay(5000); // Aguardar WebSocket estabelecer conexão
        console.log(`📱 Solicitando código de pareamento para: ${cleanNumber}`);
        
        try {
          const code = await this.sock.requestPairingCode(cleanNumber);
          this.pairingCode = code;
          this.pairingInProgress = true; // Marcar que pareamento está em progresso
          console.log(`✅ Código de pareamento gerado: ${code}`);
        } catch (err: any) {
          console.error('❌ Erro ao solicitar código de pareamento:', err.message);
          this.connecting = false;
          this.pairingInProgress = false;
          throw new Error('Falha ao gerar código de pareamento. Verifique o número.');
        }
      }

      this.setupConnectionHandlers(handler);
      this.setupMessageHandlers();

    } catch (error) {
      this.connecting = false;
      this.shouldReconnect = false;
      console.error('Erro ao conectar via Pairing Code:', error);
      throw error;
    }
  }

  /**
   * Conectar via QR Code (método tradicional)
   */
  async connectWithQR(handler: MessageHandler): Promise<void> {
    if (this.connecting) {
      console.log('Bot já está conectando, aguarde...');
      return;
    }

    if (this.connected) {
      console.log('Bot já está conectado');
      return;
    }

    this.connecting = true;
    this.shouldReconnect = true;
    this.messageHandler = handler;
    this.connectionMethod = 'qr';
    this.qrCode = null;
    this.pairingCode = null;

    console.log('📷 Iniciando conexão via QR Code...');

    try {
      const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
      const logger = pino({ level: 'silent' });

      this.sock = makeWASocket({
        ...this.getSocketConfig(state, logger),
        printQRInTerminal: true, // Mostrar QR no terminal
      });

      this.sock.ev.on('creds.update', saveCreds);
      this.setupConnectionHandlers(handler);
      this.setupMessageHandlers();

    } catch (error) {
      this.connecting = false;
      this.shouldReconnect = false;
      console.error('Erro ao conectar via QR Code:', error);
      throw error;
    }
  }

  /**
   * Método de conexão padrão (QR Code) - compatibilidade com código existente
   */
  async connect(handler: MessageHandler): Promise<void> {
    return this.connectWithQR(handler);
  }

  /**
   * Configurar handlers de conexão
   */
  private setupConnectionHandlers(handler: MessageHandler): void {
    if (!this.sock) return;

    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // Handler de QR Code (apenas para modo QR)
      if (qr && this.connectionMethod === 'qr') {
        console.log('📱 QR Code gerado - escaneie no terminal para conectar:');

        // Exibir QR Code no terminal
        qrcodeTerminal.generate(qr, { small: true }, (qrString: string) => {
          console.log('\n' + qrString);
        });

        // Converter para base64 para o frontend
        try {
          this.qrCode = await QRCode.toDataURL(qr);
          console.log('✅ QR Code também disponível via API');
        } catch (err) {
          console.error('❌ Erro ao gerar QR Code base64:', err);
        }
      }

      if (connection === 'close') {
        this.connected = false;
        this.connecting = false;

        const error = lastDisconnect?.error as Boom | undefined;
        const reason = error?.output?.statusCode;
        const errorMessage = (lastDisconnect?.error as Error)?.message || '';

        console.log('🔌 Conexão fechada. Código:', reason, 'Mensagem:', errorMessage);

        // Limpar timeout pendente
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }

        // Se pareamento está em progresso, ignorar erros transitórios (401, 428, undefined)
        if (this.pairingInProgress && (reason === 401 || reason === 428 || reason === undefined)) {
          console.log('⏳ Pareamento em progresso, aguardando confirmação do WhatsApp...');
          // Reconectar sem limpar sessão para continuar o handshake
          this.reconnectTimeout = setTimeout(() => {
            if (this.pendingPhoneNumber) {
              this.connectWithPairingCode(this.pendingPhoneNumber, handler);
            }
          }, 3000);
          return;
        }

        // Verificar se é erro Bad MAC ou de sessão
        if (badMacHandler.handleError(lastDisconnect?.error, 'connection.update')) {
          if (badMacHandler.hasReachedLimit()) {
            console.log('🔄 Reconectando após limpeza de sessão...');
            this.reconnectTimeout = setTimeout(() => {
              if (this.connectionMethod === 'pairing' && this.pendingPhoneNumber) {
                this.connectWithPairingCode(this.pendingPhoneNumber, handler);
              } else {
                this.connectWithQR(handler);
              }
            }, RECONNECT_DELAY_MS);
            return;
          }
        }

        // Tratamento por código de erro
        if (reason === DisconnectReason.loggedOut) {
          console.log('❌ Bot deslogado pelo usuário');
          this.qrCode = null;
          this.pairingCode = null;
          this.shouldReconnect = false;
          this.reconnectAttempts = 0;
          this.pairingInProgress = false;
          badMacHandler.clearAllSessionFiles();
        } else if (reason === 401 || reason === DisconnectReason.badSession) {
          console.log('🔒 Erro de autenticação. Limpando sessão...');
          this.shouldReconnect = false;
          this.pairingInProgress = false;
          badMacHandler.clearAllSessionFiles();
          console.log('✅ Sessão removida. Reinicie a conexão.');
        } else if (this.shouldReconnect && handler) {
          this.reconnectAttempts++;

          if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.log(`❌ Limite de ${MAX_RECONNECT_ATTEMPTS} tentativas atingido. Parando.`);
            this.shouldReconnect = false;
            this.reconnectAttempts = 0;
            this.qrCode = null;
            this.pairingCode = null;
          } else {
            const delay = Math.min(RECONNECT_DELAY_MS * this.reconnectAttempts, 15000);
            console.log(`🔄 Tentativa ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}. Reconectando em ${delay / 1000}s...`);
            this.reconnectTimeout = setTimeout(() => {
              if (this.connectionMethod === 'pairing' && this.pendingPhoneNumber) {
                this.connectWithPairingCode(this.pendingPhoneNumber, handler);
              } else {
                this.connectWithQR(handler);
              }
            }, delay);
          }
        }
      } else if (connection === 'open') {
        console.log('✅ Bot conectado com sucesso!');
        this.connected = true;
        this.connecting = false;
        this.qrCode = null;
        this.pairingCode = null;
        this.pairingInProgress = false; // Pareamento concluído com sucesso
        this.lastConnected = new Date();
        this.startTime = new Date();
        this.phoneNumber = this.sock?.user?.id?.split(':')[0] || null;
        this.reconnectAttempts = 0;
        badMacHandler.resetErrorCount();
        console.log('📞 Número conectado:', this.phoneNumber);
      }
    });
  }

  /**
   * Configurar handlers de mensagens
   */
  private setupMessageHandlers(): void {
    if (!this.sock) return;

    this.sock.ev.on('messages.upsert', async ({ messages }: { messages: proto.IWebMessageInfo[] }) => {
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
            console.error('Erro ao processar mensagem:', error);
            this.metrics.errors++;
          }
        }
      }
    });
  }

  async disconnect(): Promise<void> {
    console.log('🔌 Desconectando bot...');
    this.shouldReconnect = false;
    this.reconnectAttempts = 0;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.sock) {
      try {
        this.sock.ws?.close();
        await new Promise(r => setTimeout(r, 200));
        await this.sock.logout();
      } catch (error) {
        console.log('Erro ao fazer logout (pode ser normal):', error);
      }
      this.sock = null;
    }

    this.connected = false;
    this.connecting = false;
    this.qrCode = null;
    this.pairingCode = null;
    this.phoneNumber = null;
    this.startTime = null;
    this.connectionMethod = null;
    console.log('✅ Bot desconectado');
  }

  async clearSession(): Promise<void> {
    console.log('🗑️ Limpando sessão do bot...');
    this.shouldReconnect = false;
    this.reconnectAttempts = 0;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // 1. Fechar socket silenciosamente (sem logout que tenta enviar mensagem)
    if (this.sock) {
      try {
        this.sock.end(undefined);  // Fecha sem enviar mensagem
      } catch (error) {
        // Ignorar erros ao fechar
      }
      this.sock = null;
    }

    // 2. Aguardar socket liberar arquivos
    await delay(2000);

    // 3. Resetar estado primeiro
    this.connected = false;
    this.connecting = false;
    this.qrCode = null;
    this.pairingCode = null;
    this.phoneNumber = null;
    this.startTime = null;
    this.lastConnected = null;
    this.connectionMethod = null;
    this.pendingPhoneNumber = null;
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

    // 4. Limpar arquivos com retry
    await badMacHandler.clearAllSessionFilesWithRetry();

    console.log('✅ Sessão limpa. Clique em Conectar para gerar novo código.');
  }

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
    return badMacHandler.getStats();
  }
}
