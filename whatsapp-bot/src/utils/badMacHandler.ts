/**
 * Utilitário para lidar com erros "Bad MAC"
 * que são comuns em bots WhatsApp usando Baileys.
 *
 * Este módulo fornece funções para detectar, contar
 * e lidar graciosamente com esses erros.
 *
 * Baseado no takeshi-bot (https://github.com/guiireal/takeshi-bot)
 * @author Dev Gui (estrutura original)
 * @adapted Vista Alegre Portal
 */

import fs from 'node:fs';
import path from 'node:path';
import { AUTH_FOLDER } from '../config';

class BadMacHandler {
  private errorCount: number = 0;
  private maxRetries: number = 5;
  private resetInterval: number = 300000; // 5 minutos
  private lastReset: number = Date.now();

  /**
   * Detecta se é um erro Bad MAC
   */
  isBadMacError(error: any): boolean {
    const errorMessage = error?.message || error?.toString() || '';
    return (
      errorMessage.includes('Bad MAC') ||
      errorMessage.includes('MAC verification failed') ||
      errorMessage.includes('decryption failed')
    );
  }

  /**
   * Detecta se é um erro de sessão
   */
  isSessionError(error: any): boolean {
    const errorMessage = error?.message || error?.toString() || '';
    return (
      errorMessage.includes('Session') ||
      errorMessage.includes('signal protocol') ||
      errorMessage.includes('decrypt') ||
      this.isBadMacError(error)
    );
  }

  /**
   * Limpa arquivos de sessão problemáticos (preserva credenciais)
   */
  clearProblematicSessionFiles(): boolean {
    try {
      const baileysFolder = path.resolve(process.cwd(), AUTH_FOLDER);

      if (!fs.existsSync(baileysFolder)) {
        return false;
      }

      const files = fs.readdirSync(baileysFolder);
      let removedCount = 0;

      for (const file of files) {
        const filePath = path.join(baileysFolder, file);
        
        if (fs.statSync(filePath).isFile()) {
          // Preservar arquivos essenciais
          if (
            file.includes('app-state-sync-key') ||
            file === 'creds.json' ||
            file.includes('app-state-sync-version')
          ) {
            console.log(`✅ Preservando: ${file}`);
            continue;
          }

          // Remover arquivos problemáticos
          try {
            fs.unlinkSync(filePath);
            removedCount++;
            console.log(`🗑️ Removido: ${file}`);
          } catch (err: any) {
            console.error(`❌ Erro ao remover ${file}:`, err.message);
          }
        }
      }

      if (removedCount > 0) {
        console.log(`⚠️ ${removedCount} arquivos de sessão problemáticos removidos. Credenciais preservadas.`);
        return true;
      }

      return false;
    } catch (error: any) {
      console.error(`❌ Erro ao limpar arquivos de sessão: ${error.message}`);
      return false;
    }
  }

  /**
   * Limpa toda a sessão (para reconexão completa)
   */
  clearAllSessionFiles(): boolean {
    try {
      const baileysFolder = path.resolve(process.cwd(), AUTH_FOLDER);

      if (!fs.existsSync(baileysFolder)) {
        return false;
      }

      fs.rmSync(baileysFolder, { recursive: true, force: true });
      console.log('🗑️ Toda a sessão foi removida');
      return true;
    } catch (error: any) {
      console.error(`❌ Erro ao limpar sessão: ${error.message}`);
      return false;
    }
  }

  /**
   * Incrementa contador de erros
   */
  incrementErrorCount(): void {
    this.errorCount++;
    console.log(`⚠️ Bad MAC error count: ${this.errorCount}/${this.maxRetries}`);

    // Auto-reset após intervalo
    const now = Date.now();
    if (now - this.lastReset > this.resetInterval) {
      this.resetErrorCount();
    }
  }

  /**
   * Reseta contador de erros
   */
  resetErrorCount(): void {
    const previousCount = this.errorCount;
    this.errorCount = 0;
    this.lastReset = Date.now();

    if (previousCount > 0) {
      console.log(`✅ Reset do contador de Bad MAC errors. Contador anterior: ${previousCount}`);
    }
  }

  /**
   * Verifica se atingiu limite
   */
  hasReachedLimit(): boolean {
    return this.errorCount >= this.maxRetries;
  }

  /**
   * Handler principal de erros Bad MAC
   */
  handleError(error: any, context: string = 'unknown'): boolean {
    if (!this.isBadMacError(error)) {
      return false;
    }

    console.log(`❌ Bad MAC error detectado em ${context}: ${error?.message || error}`);
    this.incrementErrorCount();

    if (this.hasReachedLimit()) {
      console.log(`⚠️ Limite de Bad MAC errors atingido (${this.maxRetries}). Considere reiniciar o bot.`);
      return true;
    }

    console.log(`⏳ Ignorando Bad MAC error e continuando operação... (${this.errorCount}/${this.maxRetries})`);
    return true;
  }

  /**
   * Wrapper para funções com tratamento de Bad MAC
   */
  createSafeWrapper<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context: string
  ): T {
    return (async (...args: any[]) => {
      try {
        return await fn(...args);
      } catch (error) {
        if (this.handleError(error, context)) {
          return null;
        }
        throw error;
      }
    }) as T;
  }

  /**
   * Estatísticas do handler
   */
  getStats(): object {
    return {
      errorCount: this.errorCount,
      maxRetries: this.maxRetries,
      lastReset: new Date(this.lastReset).toISOString(),
      timeUntilReset: Math.max(0, this.resetInterval - (Date.now() - this.lastReset))
    };
  }
}

export const badMacHandler = new BadMacHandler();
