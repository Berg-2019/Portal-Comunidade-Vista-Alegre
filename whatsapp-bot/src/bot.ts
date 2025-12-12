/**
 * Script de conexão do bot.
 *
 * Este script é responsável por iniciar a conexão com o WhatsApp.
 * Baseado 100% no takeshi-bot (https://github.com/guiireal/takeshi-bot)
 *
 * @author Dev Gui (estrutura original)
 * @adapted Vista Alegre Portal
 */

import makeWASocket, {
  WASocket,
  proto,
  DisconnectReason,
  isJidBroadcast,
  isJidNewsletter,
  isJidStatusBroadcast,
  useMultiFileAuthState
} from 'baileys';
import NodeCache from 'node-cache';
import fs from 'node:fs';
import path from 'node:path';
import pino from 'pino';
import QRCode from 'qrcode';

import {
  AUTH_FOLDER,
  WAWEB_VERSION,
  TEMP_DIR,
  BOT_NAME
} from './config';
import { badMacHandler } from './utils/badMacHandler';
import {
  infoLog,
  successLog,
  warningLog,
  errorLog,
  sayLog
} from './utils/logger';

// Criar diretório temp se não existir
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Logger para arquivo (igual takeshi-bot)
const logger = pino(
  { timestamp: () => `,"time":"${new Date().toJSON()}"` },
  pino.destination(path.join(TEMP_DIR, 'wa-logs.txt'))
);
logger.level = 'error';

// Cache para retry de mensagens
const msgRetryCounterCache = new NodeCache();

// Tipos
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

/**
 * Classe principal do Bot WhatsApp
 * Estrutura baseada 100% no takeshi-bot
 */
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
   * Conectar via Pairing Code (estrutura takeshi-bot)
   */
  async connectWithPairingCode(phoneNumber: string, handler: MessageHandler): Promise<WASocket> {
    if (this.connecting) {
      warningLog('Bot já está conectando, aguarde...');
      throw new Error('Bot já está conectando');
    }

    if (this.connected && this.sock) {
      warningLog('Bot já está conectado');
      return this.sock;
    }

    this.connecting = true;
    this.messageHandler = handler;
    this.connectionMethod = 'pairing';
    this.pendingPhoneNumber = phoneNumber.replace(/\D/g, '');
    this.qrCode = null;
    this.pairingCode = null;

    infoLog(`Iniciando conexão via Pairing Code para: ${this.pendingPhoneNumber}`);

    return this.connect(handler);
  }

  /**
   * Conectar via QR Code
   */
  async connectWithQR(handler: MessageHandler): Promise<WASocket> {
    if (this.connecting) {
      warningLog('Bot já está conectando, aguarde...');
      throw new Error('Bot já está conectando');
    }

    if (this.connected && this.sock) {
      warningLog('Bot já está conectado');
      return this.sock;
    }

    this.connecting = true;
    this.messageHandler = handler;
    this.connectionMethod = 'qr';
    this.pendingPhoneNumber = null;
    this.qrCode = null;
    this.pairingCode = null;

    infoLog('Iniciando conexão via QR Code...');

    return this.connect(handler);
  }

  /**
   * Função principal de conexão (estrutura 100% takeshi-bot)
   */
  async connect(handler: MessageHandler): Promise<WASocket> {
    this.messageHandler = handler;

    const baileysFolder = path.resolve(process.cwd(), AUTH_FOLDER);

    // Garantir que pasta existe
    if (!fs.existsSync(baileysFolder)) {
      fs.mkdirSync(baileysFolder, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(baileysFolder);

    // Criar socket (configuração 100% takeshi-bot)
    const socket = makeWASocket({
      version: WAWEB_VERSION,
      logger,
      defaultQueryTimeoutMs: undefined,
      retryRequestDelayMs: 5000,
      auth: state,
      shouldIgnoreJid: (jid) =>
        isJidBroadcast(jid) || isJidStatusBroadcast(jid) || isJidNewsletter(jid),
      connectTimeoutMs: 20_000,
      keepAliveIntervalMs: 30_000,
      maxMsgRetryCount: 5,
      markOnlineOnConnect: true,
      syncFullHistory: false,
      emitOwnEvents: false,
      msgRetryCounterCache,
      shouldSyncHistoryMessage: () => false
    });

    this.sock = socket;

    // Solicitar pairing code se não registrado (estrutura takeshi-bot)
    if (!socket.authState.creds.registered) {
      if (this.connectionMethod === 'pairing' && this.pendingPhoneNumber) {
        warningLog('Credenciais ainda não configuradas!');
        infoLog(`Solicitando código de pareamento para: ${this.pendingPhoneNumber}`);

        try {
          const code = await socket.requestPairingCode(this.pendingPhoneNumber);
          this.pairingCode = code;
          sayLog(`Código de pareamento: ${code}`);
        } catch (err: any) {
          errorLog(`Falha ao gerar código de pareamento: ${err.message}`);
          this.connecting = false;
          throw new Error('Falha ao gerar código de pareamento. Verifique o número.');
        }
      } else {
        infoLog('Aguardando escaneamento do QR Code...');
      }
    }

    // Handler de conexão (estrutura 100% takeshi-bot)
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // QR Code
      if (qr && this.connectionMethod === 'qr') {
        infoLog('QR Code gerado');
        try {
          this.qrCode = await QRCode.toDataURL(qr);
        } catch (err) {
          errorLog('Erro ao converter QR Code para base64');
        }
      }

      if (connection === 'close') {
        this.connected = false;
        this.connecting = false;

        const error = lastDisconnect?.error as any;
        const statusCode = error?.output?.statusCode;

        // Tratamento de Bad MAC (igual takeshi-bot)
        if (
          error?.message?.includes('Bad MAC') ||
          error?.toString()?.includes('Bad MAC')
        ) {
          errorLog('Bad MAC error na desconexão detectado');

          if (badMacHandler.handleError(error, 'connection.update')) {
            if (badMacHandler.hasReachedLimit()) {
              warningLog('Limite de erros Bad MAC atingido. Limpando arquivos de sessão problemáticos...');
              badMacHandler.clearProblematicSessionFiles();
              badMacHandler.resetErrorCount();

              // Reconectar
              const newSocket = await this.connect(handler);
              return;
            }
          }
        }

        // Tratamento por código de erro (igual takeshi-bot)
        if (statusCode === DisconnectReason.loggedOut) {
          errorLog('Bot desconectado!');
          this.qrCode = null;
          this.pairingCode = null;
          badMacHandler.clearAllSessionFiles();
        } else {
          switch (statusCode) {
            case DisconnectReason.badSession:
              warningLog('Sessão inválida!');
              const sessionError = new Error('Bad session detected');
              if (badMacHandler.handleError(sessionError, 'badSession')) {
                if (badMacHandler.hasReachedLimit()) {
                  warningLog('Limite de erros de sessão atingido. Limpando arquivos de sessão...');
                  badMacHandler.clearProblematicSessionFiles();
                  badMacHandler.resetErrorCount();
                }
              }
              break;
            case DisconnectReason.connectionClosed:
              warningLog('Conexão fechada!');
              break;
            case DisconnectReason.connectionLost:
              warningLog('Conexão perdida!');
              break;
            case DisconnectReason.connectionReplaced:
              warningLog('Conexão substituída!');
              break;
            case DisconnectReason.multideviceMismatch:
              warningLog('Dispositivo incompatível!');
              break;
            case DisconnectReason.forbidden:
              warningLog('Conexão proibida!');
              break;
            case DisconnectReason.restartRequired:
              infoLog('Reinício requerido pelo WhatsApp');
              break;
            case DisconnectReason.unavailableService:
              warningLog('Serviço indisponível!');
              break;
            default:
              warningLog(`Desconectado com código: ${statusCode}`);
          }

          // Reconectar automaticamente (igual takeshi-bot)
          infoLog('Reconectando...');
          const newSocket = await this.connect(handler);
        }
      } else if (connection === 'open') {
        successLog('Fui conectado com sucesso!');
        infoLog('Versão do WhatsApp Web: ' + WAWEB_VERSION.join('.'));
        successLog(`✅ ${BOT_NAME} está pronto para uso!`);

        this.connected = true;
        this.connecting = false;
        this.qrCode = null;
        this.pairingCode = null;
        this.lastConnected = new Date();
        this.startTime = new Date();
        this.phoneNumber = socket.user?.id?.split(':')[0] || null;
        
        badMacHandler.resetErrorCount();
        
        infoLog(`Número conectado: ${this.phoneNumber}`);
      } else {
        infoLog('Atualizando conexão...');
      }
    });

    // Salvar credenciais
    socket.ev.on('creds.update', saveCreds);

    // Handler de mensagens
    socket.ev.on('messages.upsert', async ({ messages }) => {
      for (const msg of messages) {
        if (msg.key && !msg.key.fromMe && msg.message) {
          this.metrics.messagesReceived++;
          const startTime = Date.now();

          try {
            if (this.messageHandler) {
              await this.messageHandler(msg, socket);
            }

            const responseTime = Date.now() - startTime;
            this.responseTimes.push(responseTime);
            if (this.responseTimes.length > 100) {
              this.responseTimes.shift();
            }
            this.metrics.averageResponseTime =
              this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
          } catch (error: any) {
            errorLog(`Erro ao processar mensagem: ${error.message}`);
            this.metrics.errors++;
          }
        }
      }
    });

    return socket;
  }

  /**
   * Desconectar
   */
  async disconnect(): Promise<void> {
    infoLog('Desconectando bot...');

    if (this.sock) {
      try {
        this.sock.end(undefined);
      } catch (error) {
        // Ignorar
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

    successLog('Bot desconectado');
  }

  /**
   * Limpar sessão
   */
  async clearSession(): Promise<void> {
    infoLog('Limpando sessão do bot...');

    // Fechar socket primeiro
    if (this.sock) {
      try {
        this.sock.end(undefined);
      } catch (error) {
        // Ignorar
      }
      this.sock = null;
    }

    // Aguardar liberação
    await new Promise(r => setTimeout(r, 1000));

    // Limpar arquivos
    badMacHandler.clearAllSessionFiles();

    // Resetar estado
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

    successLog('Sessão limpa. Clique em Conectar para gerar novo código.');
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
    return badMacHandler.getStats();
  }
}
