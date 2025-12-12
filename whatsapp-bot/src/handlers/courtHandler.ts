import { WASocket } from 'baileys';
import { ApiClient } from '../services/apiClient';
import { SessionManager, UserSession } from '../services/sessionManager';
import { MessageTemplates } from '../utils/messageTemplates';

interface Court {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  is_maintenance: boolean;
}

interface TimeSlot {
  id: number;
  start_time: string;
  end_time: string;
  day_of_week: number;
  is_available: boolean;
}

export class CourtHandler {
  private courts: Court[] = [];

  constructor(private apiClient: ApiClient) {}

  async getCourts(): Promise<Court[]> {
    try {
      const response = await this.apiClient.get('/api/courts');
      this.courts = response.data.filter((c: Court) => c.is_active && !c.is_maintenance);
      return this.courts;
    } catch (error) {
      console.error('Erro ao buscar quadras:', error);
      return [];
    }
  }

  async handleStep(
    jid: string,
    text: string,
    session: UserSession,
    sock: WASocket,
    sessionManager: SessionManager
  ): Promise<void> {
    switch (session.step) {
      case 'select_court':
        await this.handleCourtSelection(jid, text, session, sock, sessionManager);
        break;

      case 'select_date':
        await this.handleDateSelection(jid, text, session, sock, sessionManager);
        break;

      case 'select_time':
        await this.handleTimeSelection(jid, text, session, sock, sessionManager);
        break;

      case 'confirm_name':
        await this.handleNameConfirmation(jid, text, session, sock, sessionManager);
        break;
    }
  }

  private async handleCourtSelection(
    jid: string,
    text: string,
    session: UserSession,
    sock: WASocket,
    sessionManager: SessionManager
  ): Promise<void> {
    const courtIndex = parseInt(text) - 1;
    
    if (isNaN(courtIndex) || courtIndex < 0 || courtIndex >= this.courts.length) {
      await sock.sendMessage(jid, { 
        text: '❌ Opção inválida. Por favor, escolha um número da lista.' 
      });
      return;
    }

    const selectedCourt = this.courts[courtIndex];
    
    sessionManager.updateSession(jid, {
      ...session,
      step: 'select_date',
      data: { ...session.data, courtId: selectedCourt.id, courtName: selectedCourt.name }
    });

    await sock.sendMessage(jid, { 
      text: MessageTemplates.dateSelection() 
    });
  }

  private async handleDateSelection(
    jid: string,
    text: string,
    session: UserSession,
    sock: WASocket,
    sessionManager: SessionManager
  ): Promise<void> {
    const dayIndex = parseInt(text) - 1;
    const dates = this.getNextDays(7);
    
    if (isNaN(dayIndex) || dayIndex < 0 || dayIndex >= dates.length) {
      await sock.sendMessage(jid, { 
        text: '❌ Opção inválida. Por favor, escolha um número da lista.' 
      });
      return;
    }

    const selectedDate = dates[dayIndex];
    const dayOfWeek = selectedDate.getDay();

    try {
      const response = await this.apiClient.get(
        `/api/courts/${session.data.courtId}/slots?dayOfWeek=${dayOfWeek}`
      );
      
      const slots: TimeSlot[] = response.data.slots.filter((s: TimeSlot) => s.is_available);
      
      if (slots.length === 0) {
        await sock.sendMessage(jid, { 
          text: '😔 Não há horários disponíveis para esta data. Escolha outra data:\n\n' + 
                MessageTemplates.dateSelection() 
        });
        return;
      }

      sessionManager.updateSession(jid, {
        ...session,
        step: 'select_time',
        data: { 
          ...session.data, 
          date: selectedDate.toISOString().split('T')[0],
          dateFormatted: this.formatDate(selectedDate),
          slots 
        }
      });

      await sock.sendMessage(jid, { 
        text: MessageTemplates.timeSelection(slots, this.formatDate(selectedDate)) 
      });
    } catch (error) {
      console.error('Erro ao buscar horários:', error);
      await sock.sendMessage(jid, { 
        text: MessageTemplates.error() 
      });
    }
  }

  private async handleTimeSelection(
    jid: string,
    text: string,
    session: UserSession,
    sock: WASocket,
    sessionManager: SessionManager
  ): Promise<void> {
    const slots: TimeSlot[] = session.data.slots || [];
    const slotIndex = parseInt(text) - 1;
    
    if (isNaN(slotIndex) || slotIndex < 0 || slotIndex >= slots.length) {
      await sock.sendMessage(jid, { 
        text: '❌ Opção inválida. Por favor, escolha um número da lista.' 
      });
      return;
    }

    const selectedSlot = slots[slotIndex];
    
    sessionManager.updateSession(jid, {
      ...session,
      step: 'confirm_name',
      data: { 
        ...session.data, 
        slotId: selectedSlot.id,
        startTime: selectedSlot.start_time,
        endTime: selectedSlot.end_time
      }
    });

    await sock.sendMessage(jid, { 
      text: '👤 Por favor, digite seu *nome completo* para a reserva:' 
    });
  }

  private async handleNameConfirmation(
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

    const { courtId, courtName, date, dateFormatted, startTime, endTime, slotId } = session.data;
    const userPhone = jid.replace('@s.whatsapp.net', '');

    try {
      // Save reservation to database via API
      await this.apiClient.post('/api/reservations', {
        court_id: courtId,
        slot_id: slotId,
        user_name: text,
        user_phone: userPhone,
        reservation_date: date,
        start_time: startTime,
        end_time: endTime,
        source: 'whatsapp'
      });

      // Clear session
      sessionManager.clearSession(jid);

      // Send confirmation
      await sock.sendMessage(jid, { 
        text: MessageTemplates.reservationConfirmation({
          courtName,
          date: dateFormatted,
          startTime,
          endTime,
          name: text
        })
      });
    } catch (error: any) {
      console.error('Erro ao salvar reserva:', error);
      
      if (error.response?.status === 409) {
        await sock.sendMessage(jid, { 
          text: '❌ Este horário já foi reservado por outra pessoa. Por favor, escolha outro horário.\n\nDigite *1* para voltar ao menu principal.'
        });
      } else {
        await sock.sendMessage(jid, { 
          text: '❌ Ocorreu um erro ao processar sua reserva. Por favor, tente novamente.\n\nDigite *1* para voltar ao menu principal.'
        });
      }
      
      sessionManager.clearSession(jid);
    }
  }

  private getNextDays(count: number): Date[] {
    const days: Date[] = [];
    const today = new Date();
    
    for (let i = 0; i < count; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    
    return days;
  }

  private formatDate(date: Date): string {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${days[date.getDay()]}, ${day}/${month}`;
  }
}
