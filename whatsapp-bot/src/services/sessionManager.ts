export interface UserSession {
  currentFlow: 'court' | 'occurrence' | 'package' | null;
  step: string;
  data: Record<string, any>;
  lastActivity: Date;
}

export class SessionManager {
  private sessions: Map<string, UserSession> = new Map();
  private readonly SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes

  constructor() {
    // Cleanup expired sessions every minute
    setInterval(() => this.cleanupExpiredSessions(), 60000);
  }

  getSession(jid: string): UserSession | null {
    const session = this.sessions.get(jid);
    
    if (!session) return null;
    
    // Check if session expired
    if (Date.now() - session.lastActivity.getTime() > this.SESSION_TIMEOUT) {
      this.sessions.delete(jid);
      return null;
    }
    
    return session;
  }

  updateSession(jid: string, session: Partial<UserSession>): void {
    const existing = this.sessions.get(jid) || {
      currentFlow: null,
      step: '',
      data: {},
      lastActivity: new Date()
    };

    this.sessions.set(jid, {
      ...existing,
      ...session,
      lastActivity: new Date()
    });
  }

  clearSession(jid: string): void {
    this.sessions.delete(jid);
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [jid, session] of this.sessions.entries()) {
      if (now - session.lastActivity.getTime() > this.SESSION_TIMEOUT) {
        this.sessions.delete(jid);
        console.log(`🗑️ Sessão expirada removida: ${jid}`);
      }
    }
  }

  getActiveSessions(): number {
    return this.sessions.size;
  }
}
