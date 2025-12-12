/**
 * Configurações do Bot WhatsApp
 * Baseado no takeshi-bot (https://github.com/guiireal/takeshi-bot)
 * 
 * @author Dev Gui (estrutura original)
 * @adapted Vista Alegre Portal
 */

import path from 'node:path';

// Nome do bot
export const BOT_NAME = 'Vista Alegre Bot';

// Emoji do bot
export const BOT_EMOJI = '🤖';

// Diretório de autenticação
export const AUTH_FOLDER = './auth_info';

// Diretório de arquivos temporários
export const TEMP_DIR = path.resolve(process.cwd(), 'temp');

// Configurações de reconexão
export const MAX_RECONNECT_ATTEMPTS = 5;
export const RECONNECT_DELAY_MS = 5000;

// Timeout por evento (evita banimento)
export const TIMEOUT_IN_MILLISECONDS_BY_EVENT = 700;

// Versão do WhatsApp Web (igual takeshi-bot)
export const WAWEB_VERSION: [number, number, number] = [2, 3000, 1030831524];

// Modo desenvolvedor (mostra logs de mensagens)
export const DEVELOPER_MODE = false;
