import { WASocket } from '@whiskeysockets/baileys';
import { ApiClient } from '../services/apiClient';
import { SessionManager, UserSession } from '../services/sessionManager';
import { MessageTemplates } from '../utils/messageTemplates';

const CATEGORIES = [
  { id: 'iluminacao', name: 'Iluminação Pública', icon: '💡' },
  { id: 'buraco', name: 'Buracos/Vias', icon: '🕳️' },
  { id: 'agua', name: 'Água/Esgoto', icon: '💧' },
  { id: 'lixo', name: 'Lixo/Limpeza', icon: '🗑️' },
  { id: 'seguranca', name: 'Segurança', icon: '🚨' },
  { id: 'outros', name: 'Outros', icon: '📋' }
];

export class OccurrenceHandler {
  constructor(private apiClient: ApiClient) {}

  async handleStep(
    jid: string,
    text: string,
    session: UserSession,
    sock: WASocket,
    sessionManager: SessionManager
  ): Promise<void> {
    switch (session.step) {
      case 'select_category':
        await this.handleCategorySelection(jid, text, session, sock, sessionManager);
        break;

      case 'enter_location':
        await this.handleLocationEntry(jid, text, session, sock, sessionManager);
        break;

      case 'enter_description':
        await this.handleDescriptionEntry(jid, text, session, sock, sessionManager);
        break;

      case 'enter_name':
        await this.handleNameEntry(jid, text, session, sock, sessionManager);
        break;
    }
  }

  private async handleCategorySelection(
    jid: string,
    text: string,
    session: UserSession,
    sock: WASocket,
    sessionManager: SessionManager
  ): Promise<void> {
    const categoryIndex = parseInt(text) - 1;
    
    if (isNaN(categoryIndex) || categoryIndex < 0 || categoryIndex >= CATEGORIES.length) {
      await sock.sendMessage(jid, { 
        text: '❌ Opção inválida. Por favor, escolha um número da lista.' 
      });
      return;
    }

    const selectedCategory = CATEGORIES[categoryIndex];
    
    sessionManager.updateSession(jid, {
      ...session,
      step: 'enter_location',
      data: { 
        ...session.data, 
        categoryId: selectedCategory.id, 
        categoryName: selectedCategory.name 
      }
    });

    await sock.sendMessage(jid, { 
      text: '📍 *Localização*\n\nDigite o endereço ou ponto de referência onde o problema está localizado:\n\n_Exemplo: Rua Principal, próximo ao mercado_' 
    });
  }

  private async handleLocationEntry(
    jid: string,
    text: string,
    session: UserSession,
    sock: WASocket,
    sessionManager: SessionManager
  ): Promise<void> {
    if (text.length < 5) {
      await sock.sendMessage(jid, { 
        text: '❌ Localização muito curta. Por favor, forneça mais detalhes:' 
      });
      return;
    }

    sessionManager.updateSession(jid, {
      ...session,
      step: 'enter_description',
      data: { ...session.data, location: text }
    });

    await sock.sendMessage(jid, { 
      text: '📝 *Descrição do Problema*\n\nDescreva o problema com detalhes:\n\n_Exemplo: Poste sem luz há 3 dias, prejudicando a segurança da rua_' 
    });
  }

  private async handleDescriptionEntry(
    jid: string,
    text: string,
    session: UserSession,
    sock: WASocket,
    sessionManager: SessionManager
  ): Promise<void> {
    if (text.length < 10) {
      await sock.sendMessage(jid, { 
        text: '❌ Descrição muito curta. Por favor, forneça mais detalhes sobre o problema:' 
      });
      return;
    }

    sessionManager.updateSession(jid, {
      ...session,
      step: 'enter_name',
      data: { ...session.data, description: text }
    });

    await sock.sendMessage(jid, { 
      text: '👤 *Seu Nome*\n\nDigite seu nome para identificação da ocorrência:' 
    });
  }

  private async handleNameEntry(
    jid: string,
    text: string,
    session: UserSession,
    sock: WASocket,
    sessionManager: SessionManager
  ): Promise<void> {
    if (text.length < 3) {
      await sock.sendMessage(jid, { 
        text: '❌ Nome muito curto. Por favor, digite seu nome completo:' 
      });
      return;
    }

    const { categoryId, categoryName, location, description } = session.data;
    const phoneNumber = jid.split('@')[0];

    try {
      // Submit occurrence to API
      await this.apiClient.post('/api/occurrences', {
        category: categoryId,
        location,
        description,
        reporter_name: text,
        reporter_phone: phoneNumber,
        status: 'pending'
      });

      // Clear session
      sessionManager.clearSession(jid);

      // Send confirmation
      await sock.sendMessage(jid, { 
        text: MessageTemplates.occurrenceConfirmation({
          category: categoryName,
          location,
          description,
          name: text
        })
      });
    } catch (error) {
      console.error('Erro ao registrar ocorrência:', error);
      await sock.sendMessage(jid, { 
        text: MessageTemplates.error() 
      });
    }
  }
}
