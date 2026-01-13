interface Court {
  id: number;
  name: string;
  description: string;
}

interface TimeSlot {
  start_time: string;
  end_time: string;
}

interface Package {
  recipient_name: string;
  tracking_code: string;
  status: string;
  arrival_date: string;
  pickup_deadline: string;
}

interface ReservationData {
  courtName: string;
  date: string;
  startTime: string;
  endTime: string;
  name: string;
}

interface OccurrenceData {
  category: string;
  location: string;
  description: string;
  name: string;
}

export class MessageTemplates {
  static mainMenu(): string {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    return `╭─〘 *BEM VINDO!* 〙
│
│ • Portal Vista Alegre
│ • Data: ${dateStr}
│ • Hora: ${timeStr}
│
╰━━━━━ 〔 🏠 〕 ━━━━━

╭─〘 *SERVIÇOS* 〙
│
│ *1.* ⚽ Reservar Quadra
│ _Reserve horário nas quadras_
│
│ *2.* 🚨 Reportar Ocorrência
│ _Informe problemas no distrito_
│
│ *3.* 📦 Consultar Encomendas
│ _Verifique suas encomendas_
│
╰━━━━━ 〔 📋 〕 ━━━━━

╭─〘 *INFORMAÇÕES* 〙
│
│ *4.* 📰 Últimas Notícias
│ *5.* 📞 Contatos Úteis
│ *6.* ℹ️ Sobre o Portal
│
╰━━━━━ 〔 ℹ️ 〕 ━━━━━

_Digite o número da opção desejada_
_ou "menu" a qualquer momento_`;
  }

  static courtSelection(courts: Court[]): string {
    if (courts.length === 0) {
      return `╭─〘 *QUADRAS* 〙
│
│ 😔 Nenhuma quadra disponível
│ no momento.
│
╰━━━━━ 〔 ⚽ 〕 ━━━━━

_Digite "menu" para voltar_`;
    }

    let message = `╭─〘 *RESERVA DE QUADRAS* 〙
│
│ Escolha a quadra:
│\n`;
    
    courts.forEach((court, index) => {
      message += `│ *${index + 1}.* ⚽ ${court.name}\n`;
      if (court.description) {
        message += `│    _${court.description}_\n`;
      }
    });

    message += `│
╰━━━━━ 〔 ⚽ 〕 ━━━━━

_Digite o número da quadra_
_ou "0" para cancelar_`;
    
    return message;
  }

  static dateSelection(availableDates?: Array<{date: Date; dayIndex: number}>): string {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    let message = `╭─〘 *ESCOLHA A DATA* 〙
│\n`;
    
    if (availableDates && availableDates.length > 0) {
      // Mostrar apenas datas com horários disponíveis
      availableDates.forEach((item, index) => {
        const day = item.date.getDate().toString().padStart(2, '0');
        const month = (item.date.getMonth() + 1).toString().padStart(2, '0');
        const dayName = days[item.date.getDay()];
        const isToday = item.dayIndex === 0;
        const isTomorrow = item.dayIndex === 1;
        const label = isToday ? '_(Hoje)_' : isTomorrow ? '_(Amanhã)_' : '';
        
        message += `│ *${index + 1}.* 📅 ${dayName}, ${day}/${month} ${label}\n`;
      });
    } else {
      // Fallback: mostrar próximos 7 dias
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const dayName = days[date.getDay()];
        const label = i === 0 ? '_(Hoje)_' : i === 1 ? '_(Amanhã)_' : '';
        
        message += `│ *${i + 1}.* 📅 ${dayName}, ${day}/${month} ${label}\n`;
      }
    }

    message += `│
╰━━━━━ 〔 📅 〕 ━━━━━

_Digite o número do dia_
_ou "0" para cancelar_`;
    
    return message;
  }

  static timeSelection(slots: TimeSlot[], date: string): string {
    let message = `╭─〘 *HORÁRIOS DISPONÍVEIS* 〙
│
│ 📅 ${date}
│\n`;
    
    slots.forEach((slot, index) => {
      message += `│ *${index + 1}.* ⏰ ${slot.start_time} - ${slot.end_time}\n`;
    });

    message += `│
╰━━━━━ 〔 ⏰ 〕 ━━━━━

_Digite o número do horário_
_ou "0" para cancelar_`;
    
    return message;
  }

  static reservationConfirmation(data: ReservationData): string {
    return `✅ *RESERVA CONFIRMADA!*

📋 *Detalhes:*
• Quadra: ${data.courtName}
• Data: ${data.date}
• Horário: ${data.startTime} - ${data.endTime}
• Nome: ${data.name}

🎉 Sua reserva foi aprovada automaticamente! Compareça no horário agendado.

⚠️ *Importante:*
• Chegue com 10 minutos de antecedência
• Em caso de desistência, cancele com antecedência

━━━━━━━━━━━━━━━━━━
Digite *menu* para voltar ao início`;
  }

  static occurrenceCategories(): string {
    return `🚨 *REPORTAR OCORRÊNCIA*

Selecione a categoria do problema:

*1.* 💡 Iluminação Pública
*2.* 🕳️ Buracos/Vias
*3.* 💧 Água/Esgoto
*4.* 🗑️ Lixo/Limpeza
*5.* 🚨 Segurança
*6.* 📋 Outros

━━━━━━━━━━━━━━━━━━
Digite o *número* da categoria
ou *0* para cancelar`;
  }

  static occurrenceConfirmation(data: OccurrenceData): string {
    return `✅ *OCORRÊNCIA REGISTRADA!*

📋 *Detalhes:*
• Categoria: ${data.category}
• Local: ${data.location}
• Descrição: ${data.description}
• Reportado por: ${data.name}

📢 Sua ocorrência foi enviada para análise da administração. Após aprovação, será publicada no portal.

━━━━━━━━━━━━━━━━━━
Digite *menu* para voltar ao início`;
  }

  static packageNamePrompt(): string {
    return `📦 *CONSULTA DE ENCOMENDAS*

Digite seu *nome completo* para buscar encomendas:

_Exemplo: João Silva_

━━━━━━━━━━━━━━━━━━
ou *0* para cancelar`;
  }

  static packageList(packages: Package[], searchName: string): string {
    const statusEmoji: Record<string, string> = {
      'awaiting': '📬',
      'delivered': '✅',
      'returned': '↩️'
    };

    const statusLabel: Record<string, string> = {
      'awaiting': 'Aguardando retirada',
      'delivered': 'Entregue',
      'returned': 'Devolvido'
    };

    let message = `📦 *ENCOMENDAS ENCONTRADAS*\n🔍 Busca: "${searchName}"\n\n`;
    
    packages.forEach((pkg, index) => {
      const emoji = statusEmoji[pkg.status] || '📦';
      const status = statusLabel[pkg.status] || pkg.status;
      const arrivalDate = new Date(pkg.arrival_date).toLocaleDateString('pt-BR');
      
      message += `${emoji} *${pkg.recipient_name}*\n`;
      message += `   Código: ${pkg.tracking_code || 'N/A'}\n`;
      message += `   Status: ${status}\n`;
      message += `   Chegou: ${arrivalDate}\n`;
      
      if (pkg.status === 'awaiting' && pkg.pickup_deadline) {
        const deadline = new Date(pkg.pickup_deadline);
        const today = new Date();
        const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysLeft <= 3) {
          message += `   ⚠️ *Retire em ${daysLeft} dia(s)!*\n`;
        }
      }
      
      message += `\n`;
    });

    message += `━━━━━━━━━━━━━━━━━━\n📍 Local de retirada: Posto de Correios\n⏰ Horário: 8h às 17h\n\nDigite *menu* para voltar ao início`;
    
    return message;
  }

  static noPackagesFound(searchName: string): string {
    return `📭 *NENHUMA ENCOMENDA ENCONTRADA*

🔍 Busca: "${searchName}"

Não encontramos encomendas registradas com esse nome.

💡 *Dicas:*
• Verifique a grafia do nome
• Tente variações do nome
• O nome pode estar diferente no registro

━━━━━━━━━━━━━━━━━━
Digite *menu* para voltar ao início`;
  }

  static flowCancelled(): string {
    return `❌ Operação cancelada.\n`;
  }

  static error(): string {
    return `❌ *Ops! Algo deu errado.*

Por favor, tente novamente em alguns instantes.

Digite *menu* para voltar ao início.`;
  }
}
