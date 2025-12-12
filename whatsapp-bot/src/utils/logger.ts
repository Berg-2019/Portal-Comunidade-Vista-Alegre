/**
 * Utilitários de logging
 * Baseado no takeshi-bot (https://github.com/guiireal/takeshi-bot)
 * 
 * @author Dev Gui (estrutura original)
 * @adapted Vista Alegre Portal
 */

import { BOT_EMOJI, BOT_NAME } from '../config';

const getTimestamp = (): string => {
  return new Date().toLocaleTimeString('pt-BR');
};

export const infoLog = (message: string): void => {
  console.log(`[${getTimestamp()}] ℹ️ ${message}`);
};

export const successLog = (message: string): void => {
  console.log(`[${getTimestamp()}] ✅ ${message}`);
};

export const warningLog = (message: string): void => {
  console.log(`[${getTimestamp()}] ⚠️ ${message}`);
};

export const errorLog = (message: string): void => {
  console.log(`[${getTimestamp()}] ❌ ${message}`);
};

export const sayLog = (message: string): void => {
  console.log(`[${getTimestamp()}] ${BOT_EMOJI} ${BOT_NAME}: ${message}`);
};

export const debugLog = (message: string, data?: any): void => {
  console.log(`[${getTimestamp()}] 🔍 DEBUG: ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};
