/**
 * BadMacHandler - Tratamento inteligente de erros Bad MAC
 * Baseado no takeshi-bot
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
   * Detectar erro Bad MAC
   */
  isBadMacError(error: any): boolean {
    const errorMessage = error?.message || error?.toString() || '';
    return (
      errorMessage.includes('Bad MAC') ||
      errorMessage.includes('MAC verification failed') ||
      errorMessage.includes('decryption failed') ||
      errorMessage.includes('hmac mismatch')
    );
  }

  /**
   * Detectar erro de sessão
   */
  isSessionError(error: any): boolean {
    const errorMessage = error?.message || error?.toString() || '';
    return (
      errorMessage.includes('Session') ||
      errorMessage.includes('signal protocol') ||
      errorMessage.includes('decrypt') ||
      errorMessage.includes('auth') ||
      this.isBadMacError(error)
    );
  }

  /**
   * Limpar APENAS arquivos problemáticos (preservar creds.json)
   */
  clearProblematicSessionFiles(): boolean {
    try {
      const authFolder = path.resolve(process.cwd(), AUTH_FOLDER);

      if (!fs.existsSync(authFolder)) {
        console.log('📁 Pasta auth_info não existe, nada a limpar');
        return false;
      }

      const files = fs.readdirSync(authFolder);
      let removedCount = 0;

      // Arquivos essenciais que devem ser PRESERVADOS
      const preservePatterns = [
        'creds.json',
        'app-state-sync-key',
        'app-state-sync-version'
      ];

      // Arquivos problemáticos que devem ser REMOVIDOS
      const removePatterns = [
        'session-',
        'pre-key-',
        'sender-key-',
        'sender-key-memory'
      ];

      for (const file of files) {
        const filePath = path.join(authFolder, file);
        
        if (!fs.statSync(filePath).isFile()) continue;

        // Verificar se deve preservar
        const shouldPreserve = preservePatterns.some(pattern => file.includes(pattern));
        if (shouldPreserve) {
          console.log(`✅ Preservando: ${file}`);
          continue;
        }

        // Verificar se deve remover
        const shouldRemove = removePatterns.some(pattern => file.includes(pattern));
        if (shouldRemove) {
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
        console.log(`⚠️ ${removedCount} arquivos problemáticos removidos. Credenciais preservadas.`);
        return true;
      }

      console.log('📁 Nenhum arquivo problemático encontrado');
      return false;
    } catch (error: any) {
      console.error(`❌ Erro ao limpar arquivos: ${error.message}`);
      return false;
    }
  }

  /**
   * Limpar TODA a sessão (quando necessário reconectar do zero)
   */
  clearAllSessionFiles(): boolean {
    try {
      const authFolder = path.resolve(process.cwd(), AUTH_FOLDER);

      if (!fs.existsSync(authFolder)) {
        return false;
      }

      fs.rmSync(authFolder, { recursive: true, force: true });
      console.log('🗑️ Toda a sessão foi removida');
      return true;
    } catch (error: any) {
      console.error(`❌ Erro ao limpar sessão completa: ${error.message}`);
      return false;
    }
  }

  /**
   * Limpar sessão com retry e delay (para evitar EBUSY)
   */
  async clearAllSessionFilesWithRetry(maxRetries: number = 3): Promise<boolean> {
    const authFolder = path.resolve(process.cwd(), AUTH_FOLDER);

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (!fs.existsSync(authFolder)) {
          console.log('📁 Pasta auth_info não existe, nada a limpar');
          return true;
        }

        // Deletar arquivos individualmente primeiro
        const files = fs.readdirSync(authFolder);
        for (const file of files) {
          const filePath = path.join(authFolder, file);
          try {
            if (fs.statSync(filePath).isFile()) {
              fs.unlinkSync(filePath);
            }
          } catch (err) {
            // Ignorar erros em arquivos individuais
          }
        }

        // Tentar remover pasta vazia
        fs.rmdirSync(authFolder);
        console.log('🗑️ Toda a sessão foi removida com sucesso');
        return true;
      } catch (error: any) {
        if (attempt < maxRetries - 1) {
          console.log(`⏳ Aguardando liberação de arquivos... (tentativa ${attempt + 1}/${maxRetries})`);
          await new Promise(r => setTimeout(r, 1000));
        } else {
          console.error(`❌ Não foi possível limpar sessão após ${maxRetries} tentativas: ${error.message}`);
          return false;
        }
      }
    }
    return false;
  }

  /**
   * Incrementar contador de erros
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
   * Resetar contador
   */
  resetErrorCount(): void {
    const previousCount = this.errorCount;
    this.errorCount = 0;
    this.lastReset = Date.now();

    if (previousCount > 0) {
      console.log(`✅ Reset do contador Bad MAC. Anterior: ${previousCount}`);
    }
  }

  /**
   * Verificar se atingiu limite
   */
  hasReachedLimit(): boolean {
    return this.errorCount >= this.maxRetries;
  }

  /**
   * Handler principal de erros
   */
  handleError(error: any, context: string = 'unknown'): boolean {
    if (!this.isBadMacError(error) && !this.isSessionError(error)) {
      return false;
    }

    console.log(`❌ Erro de sessão em ${context}: ${error?.message || error}`);
    this.incrementErrorCount();

    if (this.hasReachedLimit()) {
      console.log(`🔄 Limite de erros atingido (${this.maxRetries}). Limpando arquivos problemáticos...`);
      this.clearProblematicSessionFiles();
      this.resetErrorCount();
      return true;
    }

    console.log(`⏳ Ignorando erro temporário (${this.errorCount}/${this.maxRetries})...`);
    return true;
  }

  /**
   * Estatísticas
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
