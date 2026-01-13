import { WASocket } from 'baileys';
import { ApiClient } from '../services/apiClient';
import { SessionManager, UserSession } from '../services/sessionManager';
import { MessageTemplates } from '../utils/messageTemplates';

interface Court {
  id: number;
  name: string;
  description: string;
  available: boolean;
  maintenance_mode: boolean;
}

interface TimeSlot {
  id: number;
  start_time: string;
  end_time: string;
  day_of_week: number;
  available: boolean;
}

export class CourtHandler {
  private courts: Court[] = [];

  constructor(private apiClient: ApiClient) {}

  async getCourts(): Promise<Court[]> {
    try {
      const response = await this.apiClient.get('/api/courts');
      this.courts = response.data.filter((c: Court) => c.available !== false && !c.maintenance_mode);
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
    
    // Buscar datas com horários disponíveis
    const availableDates = await this.getAvailableDates(selectedCourt.id);
    
    if (availableDates.length === 0) {
      await sock.sendMessage(jid, { 
        text: `╭─〘 *SEM DISPONIBILIDADE* 〙
│
│ 😔 Não há horários disponíveis
│ para ${selectedCourt.name}
│ nos próximos 7 dias.
│
╰━━━━━ 〔 ⚽ 〕 ━━━━━

_Digite "menu" para voltar_` 
      });
      sessionManager.clearSession(jid);
      return;
    }
    
    sessionManager.updateSession(jid, {
      ...session,
      step: 'select_date',
      data: { 
        ...session.data, 
        courtId: selectedCourt.id, 
        courtName: selectedCourt.name,
        availableDates 
      }
    });

    await sock.sendMessage(jid, { 
      text: MessageTemplates.dateSelection(availableDates) 
    });
  }

  private async getAvailableDates(courtId: number): Promise<Array<{date: Date; dayIndex: number}>> {
    const availableDates: Array<{date: Date; dayIndex: number}> = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay();
      
      try {
        const response = await this.apiClient.get(
          `/api/courts/${courtId}/slots?day_of_week=${dayOfWeek}`
        );
        
        const slots = response.data.slots?.filter((s: TimeSlot) => s.available !== false) || [];
        
        if (slots.length > 0) {
          availableDates.push({ date, dayIndex: i });
        }
      } catch (error) {
        console.error(`Erro ao buscar slots para dia ${dayOfWeek}:`, error);
      }
    }
    
    return availableDates;
  }

  private async handleDateSelection(
    jid: string,
    text: string,
    session: UserSession,
    sock: WASocket,
    sessionManager: SessionManager
  ): Promise<void> {
    const selectionIndex = parseInt(text) - 1;
    const availableDates: Array<{date: Date; dayIndex: number}> = session.data.availableDates || [];
    
    if (isNaN(selectionIndex) || selectionIndex < 0 || selectionIndex >= availableDates.length) {
      await sock.sendMessage(jid, { 
        text: '❌ Opção inválida. Por favor, escolha um número da lista.' 
      });
      return;
    }

    const selectedDateInfo = availableDates[selectionIndex];
    const selectedDate = new Date(selectedDateInfo.date);
    const dayOfWeek = selectedDate.getDay();

    try {
      const response = await this.apiClient.get(
        `/api/courts/${session.data.courtId}/slots?day_of_week=${dayOfWeek}`
      );
      
      const slots: TimeSlot[] = response.data.slots.filter((s: TimeSlot) => s.available !== false);
      
      if (slots.length === 0) {
        await sock.sendMessage(jid, { 
          text: `╭─〘 *SEM HORÁRIOS* 〙
│
│ 😔 Não há mais horários
│ disponíveis para esta data.
│
╰━━━━━ 〔 📅 〕 ━━━━━

_Escolha outra data ou digite "menu"_` 
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
