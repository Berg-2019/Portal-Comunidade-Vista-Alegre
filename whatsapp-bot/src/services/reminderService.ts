import { WASocket } from 'baileys';
import { ApiClient } from './apiClient';

interface Reservation {
  id: number;
  court_id: number;
  court_name: string;
  user_name: string;
  user_phone: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface PendingReminder {
  reservationId: number;
  jid: string;
}

export class ReminderService {
  private running: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private pendingResponses: Map<string, PendingReminder> = new Map();

  constructor(
    private apiClient: ApiClient,
    private sock: WASocket | null = null
  ) {}

  setSocket(sock: WASocket) {
    this.sock = sock;
  }

  start() {
    if (this.running) {
      console.log('📅 ReminderService já está rodando');
      return;
    }

    this.running = true;
    console.log('📅 ReminderService iniciado - verificando a cada 60 segundos');

    // Check immediately
    this.checkReminders();

    // Then check every 60 seconds
    this.intervalId = setInterval(() => {
      this.checkReminders();
    }, 60000);
  }

  stop() {
    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('📅 ReminderService parado');
  }

  private async checkReminders() {
    if (!this.sock) {
      console.log('⚠️ Socket não disponível para enviar lembretes');
      return;
    }

    try {
      const response = await this.apiClient.get('/api/reservations/upcoming-reminders');
      const reservations: Reservation[] = response.data;

      if (reservations.length === 0) {
        return;
      }

      console.log(`📅 Encontradas ${reservations.length} reservas para lembrar`);

      for (const reservation of reservations) {
        await this.sendReminder(reservation);
      }
    } catch (error) {
      console.error('Erro ao verificar lembretes:', error);
    }
  }

  private async sendReminder(reservation: Reservation) {
    try {
      // Format phone number to WhatsApp JID
      const phone = reservation.user_phone.replace(/\D/g, '');
      const jid = `${phone}@s.whatsapp.net`;

      // Store pending response
      this.pendingResponses.set(jid, {
        reservationId: reservation.id,
        jid
      });

      // Send reminder message
      const message = this.formatReminderMessage(reservation);
      await this.sock!.sendMessage(jid, { text: message });

      // Mark reminder as sent
      await this.apiClient.put(`/api/reservations/${reservation.id}/reminder-sent`, {});

      console.log(`✅ Lembrete enviado para ${reservation.user_name} (${reservation.user_phone})`);
    } catch (error) {
      console.error(`Erro ao enviar lembrete para reserva ${reservation.id}:`, error);
    }
  }

  private formatReminderMessage(reservation: Reservation): string {
    const startTime = reservation.start_time.substring(0, 5);
    const endTime = reservation.end_time.substring(0, 5);

    return `╭─〘 *⏰ LEMBRETE DE RESERVA* 〙
│
│ Olá *${reservation.user_name}*!
│
│ Sua reserva está chegando:
│
│ ⚽ *${reservation.court_name}*
│ 📅 Horário: ${startTime} - ${endTime}
│
│ ⏳ *Começa em ~10 minutos!*
│
╰━━━━━ 〔 🏃 〕 ━━━━━

Responda:
*1* - ✅ Confirmar presença
*2* - ❌ Cancelar reserva

_Se não responder, a reserva continua confirmada_`;
  }

  // Handle response from user
  async handleReminderResponse(jid: string, text: string): Promise<string | null> {
    const pending = this.pendingResponses.get(jid);
    
    if (!pending) {
      return null; // No pending reminder for this user
    }

    const trimmedText = text.trim();
    
    if (trimmedText === '1') {
      // Confirm presence
      try {
        await this.apiClient.put(`/api/reservations/${pending.reservationId}/confirm`, {});
        this.pendingResponses.delete(jid);
        return `╭─〘 *✅ PRESENÇA CONFIRMADA* 〙
│
│ Obrigado por confirmar!
│ Nos vemos em breve! 🏃
│
╰━━━━━ 〔 ⚽ 〕 ━━━━━`;
      } catch (error) {
        console.error('Erro ao confirmar reserva:', error);
        return '❌ Erro ao confirmar. Tente novamente.';
      }
    } else if (trimmedText === '2') {
      // Cancel reservation
      try {
        await this.apiClient.put(`/api/reservations/${pending.reservationId}/cancel`, {});
        this.pendingResponses.delete(jid);
        return `╭─〘 *❌ RESERVA CANCELADA* 〙
│
│ Sua reserva foi cancelada.
│ Esperamos vê-lo em outra
│ oportunidade! 👋
│
╰━━━━━ 〔 📅 〕 ━━━━━`;
      } catch (error) {
        console.error('Erro ao cancelar reserva:', error);
        return '❌ Erro ao cancelar. Tente novamente.';
      }
    }

    return null; // Not a valid reminder response
  }

  hasPendingReminder(jid: string): boolean {
    return this.pendingResponses.has(jid);
  }
}
