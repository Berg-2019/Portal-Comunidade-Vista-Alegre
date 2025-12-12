import { proto, WASocket } from 'baileys';
import { CourtHandler } from './courtHandler';
import { OccurrenceHandler } from './occurrenceHandler';
import { PackageHandler } from './packageHandler';
import { ApiClient } from '../services/apiClient';
import { SessionManager, UserSession } from '../services/sessionManager';
import { MessageTemplates } from '../utils/messageTemplates';

export class MessageHandler {
  private apiClient: ApiClient;
  private sessionManager: SessionManager;
  private courtHandler: CourtHandler;
  private occurrenceHandler: OccurrenceHandler;
  private packageHandler: PackageHandler;

  constructor(apiUrl: string) {
    this.apiClient = new ApiClient(apiUrl);
    this.sessionManager = new SessionManager();
    this.courtHandler = new CourtHandler(this.apiClient);
    this.occurrenceHandler = new OccurrenceHandler(this.apiClient);
    this.packageHandler = new PackageHandler(this.apiClient);
  }

  async handleMessage(msg: proto.IWebMessageInfo, sock: WASocket): Promise<void> {
    const jid = msg.key.remoteJid;
    if (!jid) return;

    const text = this.extractMessageText(msg);
    if (!text) return;

    const normalizedText = text.toLowerCase().trim();
    const session = this.sessionManager.getSession(jid);

    console.log(`📩 Mensagem de ${jid}: ${text}`);

    try {
      // Check if user is in a flow
      if (session?.currentFlow) {
        await this.handleFlowMessage(jid, normalizedText, session, sock);
        return;
      }

      // Main menu commands
      if (this.isMenuCommand(normalizedText)) {
        await this.sendMenu(jid, sock);
        return;
      }

      // Option selection
      switch (normalizedText) {
        case '1':
        case 'reserva':
        case 'quadra':
        case 'quadras':
          await this.startCourtFlow(jid, sock);
          break;

        case '2':
        case 'ocorrencia':
        case 'ocorrência':
        case 'problema':
          await this.startOccurrenceFlow(jid, sock);
          break;

        case '3':
        case 'encomenda':
        case 'encomendas':
        case 'pacote':
          await this.startPackageFlow(jid, sock);
          break;

        default:
          await this.sendMenu(jid, sock);
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      await sock.sendMessage(jid, { 
        text: MessageTemplates.error() 
      });
    }
  }

  private extractMessageText(msg: proto.IWebMessageInfo): string | null {
    const messageContent = msg.message;
    if (!messageContent) return null;

    if (messageContent.conversation) {
      return messageContent.conversation;
    }
    if (messageContent.extendedTextMessage?.text) {
      return messageContent.extendedTextMessage.text;
    }
    if (messageContent.imageMessage?.caption) {
      return messageContent.imageMessage.caption;
    }
    return null;
  }

  private isMenuCommand(text: string): boolean {
    const menuCommands = ['menu', 'oi', 'olá', 'ola', 'inicio', 'início', 'começar', 'comecar', 'ajuda', 'help', 'start'];
    return menuCommands.includes(text);
  }

  private async sendMenu(jid: string, sock: WASocket): Promise<void> {
    await sock.sendMessage(jid, { 
      text: MessageTemplates.mainMenu() 
    });
  }

  private async startCourtFlow(jid: string, sock: WASocket): Promise<void> {
    this.sessionManager.updateSession(jid, {
      currentFlow: 'court',
      step: 'select_court',
      data: {}
    });

    const courts = await this.courtHandler.getCourts();
    await sock.sendMessage(jid, { 
      text: MessageTemplates.courtSelection(courts) 
    });
  }

  private async startOccurrenceFlow(jid: string, sock: WASocket): Promise<void> {
    this.sessionManager.updateSession(jid, {
      currentFlow: 'occurrence',
      step: 'select_category',
      data: {}
    });

    await sock.sendMessage(jid, { 
      text: MessageTemplates.occurrenceCategories() 
    });
  }

  private async startPackageFlow(jid: string, sock: WASocket): Promise<void> {
    this.sessionManager.updateSession(jid, {
      currentFlow: 'package',
      step: 'enter_name',
      data: {}
    });

    await sock.sendMessage(jid, { 
      text: MessageTemplates.packageNamePrompt() 
    });
  }

  private async handleFlowMessage(
    jid: string, 
    text: string, 
    session: UserSession, 
    sock: WASocket
  ): Promise<void> {
    // Cancel flow
    if (text === 'cancelar' || text === '0') {
      this.sessionManager.clearSession(jid);
      await sock.sendMessage(jid, { 
        text: MessageTemplates.flowCancelled() 
      });
      await this.sendMenu(jid, sock);
      return;
    }

    switch (session.currentFlow) {
      case 'court':
        await this.courtHandler.handleStep(jid, text, session, sock, this.sessionManager);
        break;

      case 'occurrence':
        await this.occurrenceHandler.handleStep(jid, text, session, sock, this.sessionManager);
        break;

      case 'package':
        await this.packageHandler.handleStep(jid, text, session, sock, this.sessionManager);
        break;
    }
  }
}
