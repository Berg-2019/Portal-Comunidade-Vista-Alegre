// Bot API Service - Comunicação com o microserviço WhatsApp Bot

const BOT_API_URL = import.meta.env.VITE_BOT_API_URL || 'http://localhost:3002';

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

class BotApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = BOT_API_URL;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getStatus(): Promise<BotStatus> {
    return this.request<BotStatus>('/api/bot/status');
  }

  async connect(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/bot/connect', { method: 'POST' });
  }

  async disconnect(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/bot/disconnect', { method: 'POST' });
  }

  async getQRCode(): Promise<{ qr: string }> {
    return this.request<{ qr: string }>('/api/bot/qr');
  }

  async getMetrics(): Promise<BotMetrics> {
    return this.request<BotMetrics>('/api/bot/metrics');
  }

  async healthCheck(): Promise<{ status: string; service: string }> {
    return this.request('/api/health');
  }

  async clearSession(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/bot/clear-session', { method: 'POST' });
  }

  async connectWithPairingCode(phoneNumber: string): Promise<{ success: boolean; message: string }> {
    return this.request('/api/bot/connect-pairing', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber })
    });
  }

  async getPairingCode(): Promise<{ code: string; formatted: string }> {
    return this.request<{ code: string; formatted: string }>('/api/bot/pairing-code');
  }

  async getBadMacStats(): Promise<object> {
    return this.request('/api/bot/bad-mac-stats');
  }
}

export const botApi = new BotApiService();
