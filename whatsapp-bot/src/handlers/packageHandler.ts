import { WASocket } from '@whiskeysockets/baileys';
import { ApiClient } from '../services/apiClient';
import { SessionManager, UserSession } from '../services/sessionManager';
import { MessageTemplates } from '../utils/messageTemplates';

interface Package {
  id: number;
  recipient_name: string;
  tracking_code: string;
  status: string;
  arrival_date: string;
  pickup_deadline: string;
  notes: string;
}

export class PackageHandler {
  constructor(private apiClient: ApiClient) {}

  async handleStep(
    jid: string,
    text: string,
    session: UserSession,
    sock: WASocket,
    sessionManager: SessionManager
  ): Promise<void> {
    switch (session.step) {
      case 'enter_name':
        await this.handleNameSearch(jid, text, session, sock, sessionManager);
        break;
    }
  }

  private async handleNameSearch(
    jid: string,
    text: string,
    session: UserSession,
    sock: WASocket,
    sessionManager: SessionManager
  ): Promise<void> {
    if (text.length < 2) {
      await sock.sendMessage(jid, { 
        text: '❌ Nome muito curto. Por favor, digite pelo menos 2 caracteres:' 
      });
      return;
    }

    try {
      const response = await this.apiClient.get(`/api/packages?search=${encodeURIComponent(text)}`);
      const packages: Package[] = response.data;

      // Clear session
      sessionManager.clearSession(jid);

      if (packages.length === 0) {
        await sock.sendMessage(jid, { 
          text: MessageTemplates.noPackagesFound(text) 
        });
      } else {
        await sock.sendMessage(jid, { 
          text: MessageTemplates.packageList(packages, text) 
        });
      }
    } catch (error) {
      console.error('Erro ao buscar encomendas:', error);
      sessionManager.clearSession(jid);
      await sock.sendMessage(jid, { 
        text: MessageTemplates.error() 
      });
    }
  }
}
