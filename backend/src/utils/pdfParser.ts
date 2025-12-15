/**
 * CorreiosPDFParser - Robust PDF parser for Brazilian postal (Correios) LDI lists
 * 
 * Features:
 * - Multiple parsing strategies with automatic fallback
 * - Data validation and cleaning
 * - Structured logging
 * - Caching support
 */

import fs from 'fs';
import path from 'path';
import { PDFLogger } from './pdfLogger';
import { getCachedResult, saveToCache } from './pdfCache';

// ============= Types =============

export interface PackageData {
  lineNumber: number;
  trackingCode: string;
  recipient: string;
  position: string;
  date: string;
  dateISO: string;
  confidence: number;
}

export interface ParseMetadata {
  fileName: string;
  fileSize: number;
  processingTime: number;
  strategy: string;
  expectedTotal: number;
  extractedTotal: number;
  pagesProcessed: number;
}

export interface ParseResult {
  success: boolean;
  totalPackages: number;
  packages: PackageData[];
  errors: string[];
  warnings: string[];
  metadata: ParseMetadata;
}

interface RawTextResult {
  text: string;
  pages: number;
  strategy: string;
}

// ============= Constants =============

// Brazilian tracking code format: XX000000000BR (2 letters + 9 digits + 2 letters)
const TRACKING_CODE_REGEX = /^[A-Z]{2}\d{9}[A-Z]{2}$/;
const TRACKING_CODE_GLOBAL = /[A-Z]{2}\d{9}[A-Z]{2}/g;

// Date format DD/MM/YYYY
const DATE_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;
const DATE_GLOBAL = /\d{2}\/\d{2}\/\d{4}/g;

// Position format (e.g., PCM - 120, AAF - 50)
const POSITION_REGEX = /[A-Z]{2,4}\s*-\s*\d+/g;

// ============= PDF Error Types =============

export enum PDFErrorType {
  CORRUPTED_FILE = 'PDF corrompido ou danificado',
  PASSWORD_PROTECTED = 'PDF protegido por senha',
  SCANNED_IMAGE = 'PDF parece ser imagem escaneada (OCR necessário)',
  NO_TEXT_CONTENT = 'PDF não contém texto extraível',
  UNKNOWN_FORMAT = 'Formato de PDF não reconhecido',
  EXTRACTION_FAILED = 'Falha na extração de dados',
  FILE_NOT_FOUND = 'Arquivo PDF não encontrado',
  FILE_TOO_LARGE = 'Arquivo PDF muito grande'
}

export function detectPDFError(error: any): PDFErrorType {
  const message = (error.message || '').toLowerCase();
  
  if (message.includes('password') || message.includes('encrypted')) {
    return PDFErrorType.PASSWORD_PROTECTED;
  }
  if (message.includes('corrupt') || message.includes('invalid pdf')) {
    return PDFErrorType.CORRUPTED_FILE;
  }
  if (message.includes('no text') || message.includes('empty')) {
    return PDFErrorType.NO_TEXT_CONTENT;
  }
  if (message.includes('enoent') || message.includes('not found')) {
    return PDFErrorType.FILE_NOT_FOUND;
  }
  
  return PDFErrorType.EXTRACTION_FAILED;
}

// ============= Data Validation & Cleaning =============

/**
 * Validate Brazilian tracking code format
 */
export function isValidTrackingCode(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  return TRACKING_CODE_REGEX.test(code.trim().toUpperCase());
}

/**
 * Clean and normalize recipient name
 */
export function cleanRecipientName(name: string): string {
  if (!name || typeof name !== 'string') return 'NOME NÃO IDENTIFICADO';
  
  let cleaned = name
    // Remove address after ":" or "&"
    .replace(/[:&].*$/, '')
    // Remove underscores (common in PDF forms)
    .replace(/_+/g, ' ')
    // Remove RUA, AV, TRAVESSA, etc. (addresses) - CRITICAL: Use word boundaries \b
    .replace(/\s*\b(RUA|AV|AVENIDA|TRAVESSA|TV|ESTRADA|ROD|RODOVIA|BR|KM|Nº|N°|NUMERO|BAIRRO|SETOR|QUADRA|LOTE|CASA|APT|APARTAMENTO|BLOCO|CONDOMINIO|COND|CEP|CIDADE|ESTADO|UF|RECEBEDOR|ASSINATURA)\b\s*.*/i, '')
    // Remove special characters except letters, spaces, dots, hyphens, apostrophes
    .replace(/[^\p{L}\s.\-']/gu, '')
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
  
  // VALIDATION: Filter out table headers and common non-name patterns
  const lowerCleaned = cleaned.toLowerCase();
  const headerPatterns = [
    'grupodataposicaoobjetodestinatariodata',
    'grupo data posicao objeto destinatario',
    'data receb',
    'documento',
    'assinatura',
    'recebedor'
  ];
  
  for (const pattern of headerPatterns) {
    if (lowerCleaned.includes(pattern) || lowerCleaned.replace(/\s/g, '').includes(pattern.replace(/\s/g, ''))) {
      return 'NOME NÃO IDENTIFICADO';
    }
  }
  
  // VALIDATION: Minimum 3 characters
  if (cleaned.length < 3) return 'NOME NÃO IDENTIFICADO';
  
  // VALIDATION: Minimum 2 words (for full names) - but allow single long word (compound name)
  const words = cleaned.split(' ').filter(w => w.length > 0);
  if (words.length < 2 && cleaned.length < 8) return 'NOME NÃO IDENTIFICADO';
  
  // VALIDATION: Check if it's not just numbers or single letters
  if (words.every(w => w.length === 1)) return 'NOME NÃO IDENTIFICADO';
  
  // VALIDATION: Filter out single-word non-names (CASA, LOJA, etc.)
  const singleWordInvalid = ['casa', 'loja', 'empresa', 'comercio', 'estabelecimento'];
  if (words.length === 1 && singleWordInvalid.includes(lowerCleaned)) {
    return 'NOME NÃO IDENTIFICADO';
  }
  
  // Convert to Title Case
  cleaned = words
    .map(word => {
      // Keep small words lowercase (de, da, do, dos, das, e)
      if (['de', 'da', 'do', 'dos', 'das', 'e'].includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
  
  // Limit length (max 60 chars)
  if (cleaned.length > 60) {
    cleaned = cleaned.substring(0, 60);
  }
  
  return cleaned || 'NOME NÃO IDENTIFICADO';
}

/**
 * Parse and validate date string (DD/MM/YYYY)
 */
export function parseDate(dateStr: string): { date: string; dateISO: string } | null {
  if (!dateStr || !DATE_REGEX.test(dateStr)) return null;
  
  const [day, month, year] = dateStr.split('/').map(Number);
  
  // Basic validation
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2020 || year > 2100) {
    return null;
  }
  
  // Create date and validate
  const dateObj = new Date(year, month - 1, day);
  if (isNaN(dateObj.getTime())) return null;
  
  // Check if date components match (catches invalid dates like 31/02/2024)
  if (dateObj.getDate() !== day || dateObj.getMonth() !== month - 1) {
    return null;
  }
  
  const dateISO = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  return { date: dateStr, dateISO };
}

/**
 * Clean and normalize position string
 */
export function cleanPosition(position: string): string {
  if (!position) return '';
  return position.replace(/\s+/g, ' ').trim().toUpperCase();
}

// ============= PDF Parser Strategies =============

/**
 * Strategy 1: pdf-parse v2.x (PDFParse class)
 */
async function extractWithPdfParseV2(buffer: Buffer, logger: PDFLogger): Promise<RawTextResult | null> {
  try {
    const module: any = await import('pdf-parse');
    
    if (module.PDFParse && typeof module.PDFParse === 'function') {
      logger.info('Strategy', 'Tentando pdf-parse v2.x (PDFParse class)');
      
      try {
        // Add configuration to prevent verbosity errors
        const instance = new module.PDFParse({
          verbosity: 0,
          max: 0
        });
        
        const data = await instance.loadPDF(buffer);
        
        return {
          text: data.text || '',
          pages: data.numpages || 1,
          strategy: 'pdf-parse-v2'
        };
      } catch (innerError: any) {
        logger.warn('Strategy', 'pdf-parse v2.x (new PDFParse) falhou', { 
          error: innerError.message 
        });
      }
    }
    
    return null;
  } catch (error: any) {
    logger.warn('Strategy', 'pdf-parse v2.x falhou', { error: error.message });
    return null;
  }
}

/**
 * Strategy 2: pdf-parse v1.x (direct function)
 */
async function extractWithPdfParseV1(buffer: Buffer, logger: PDFLogger): Promise<RawTextResult | null> {
  try {
    const module: any = await import('pdf-parse');
    let parser: any = null;
    
    if (typeof module === 'function') {
      parser = module;
    } else if (typeof module.default === 'function') {
      parser = module.default;
    } else if (module.default && typeof module.default.default === 'function') {
      parser = module.default.default;
    }
    
    if (parser) {
      logger.info('Strategy', 'Tentando pdf-parse v1.x (função direta)');
      const data = await parser(buffer);
      
      return {
        text: data.text || '',
        pages: data.numpages || 1,
        strategy: 'pdf-parse-v1'
      };
    }
    
    return null;
  } catch (error: any) {
    logger.warn('Strategy', 'pdf-parse v1.x falhou', { error: error.message });
    return null;
  }
}

/**
 * Strategy 3: pdf-parse direct call (most compatible via require)
 */
async function extractWithPdfParseDirect(buffer: Buffer, logger: PDFLogger): Promise<RawTextResult | null> {
  try {
    logger.info('Strategy', 'Tentando pdf-parse (chamada direta via require)');
    
    // Use require for maximum compatibility with CommonJS
    const pdfParse = require('pdf-parse');
    
    // Check if it's a function (v1.x style)
    if (typeof pdfParse === 'function') {
      const data = await pdfParse(buffer, { max: 0 });
      
      return {
        text: data.text || '',
        pages: data.numpages || 1,
        strategy: 'pdf-parse-direct'
      };
    }
    
    // Check if default export is a function
    if (pdfParse.default && typeof pdfParse.default === 'function') {
      const data = await pdfParse.default(buffer, { max: 0 });
      
      return {
        text: data.text || '',
        pages: data.numpages || 1,
        strategy: 'pdf-parse-direct-default'
      };
    }
    
    logger.warn('Strategy', 'pdf-parse direct: formato não reconhecido');
    return null;
  } catch (error: any) {
    logger.warn('Strategy', 'pdf-parse direto falhou', { error: error.message });
    return null;
  }
}

/**
 * Strategy 4: pdfjs-dist (direct usage with Uint8Array conversion)
 */
async function extractWithPdfJsDist(buffer: Buffer, logger: PDFLogger): Promise<RawTextResult | null> {
  try {
    logger.info('Strategy', 'Tentando pdfjs-dist');
    
    // Try different import paths for pdfjs-dist
    let pdfjsLib: any = null;
    
    try {
      pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    } catch {
      try {
        pdfjsLib = await import('pdfjs-dist');
      } catch {
        logger.warn('Strategy', 'pdfjs-dist não disponível');
        return null;
      }
    }
    
    // CRITICAL FIX: Convert Buffer to Uint8Array
    const uint8Array = new Uint8Array(buffer);
    
    // Add proper configuration
    const doc = await pdfjsLib.getDocument({ 
      data: uint8Array,
      verbosity: 0,
      isEvalSupported: false,
      useSystemFonts: true
    }).promise;
    
    const textPages: string[] = [];
    
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      
      // Filter empty strings
      const pageText = content.items
        .map((item: any) => item.str || '')
        .filter((str: string) => str.trim().length > 0)
        .join(' ');
        
      textPages.push(pageText);
    }
    
    return {
      text: textPages.join('\n'),
      pages: doc.numPages,
      strategy: 'pdfjs-dist'
    };
  } catch (error: any) {
    logger.warn('Strategy', 'pdfjs-dist falhou', { error: error.message });
    return null;
  }
}

// ============= Text Parsing =============

/**
 * Normalize lines by joining broken recipient names
 * This fixes the issue where PDF line breaks split recipient names into multiple lines
 */
function normalizeLinesForNames(originalText: string, logger: PDFLogger): string[] {
  const rawLines = originalText.split('\n').filter(l => l.trim().length > 0);
  const normalized: string[] = [];
  let joinedCount = 0;

  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i];

    // Strategy 1: If current line has NO tracking code but next line HAS one,
    // this line is likely a continuation of the name from the next line
    if (!TRACKING_CODE_GLOBAL.test(line) && i + 1 < rawLines.length && TRACKING_CODE_GLOBAL.test(rawLines[i + 1])) {
      // Join this line with the next line (prepend name continuation)
      rawLines[i + 1] = line.trim() + ' ' + rawLines[i + 1].trim();
      joinedCount++;
      logger.info('Normalize', `Linha ${i + 1} juntada com próxima (nome antes do código)`);
      continue; // Skip adding this line separately
    }

    // Strategy 2: If current line HAS tracking code and next line does NOT,
    // and next line looks like a name continuation (starts with uppercase, has letters)
    if (TRACKING_CODE_GLOBAL.test(line) && i + 1 < rawLines.length && !TRACKING_CODE_GLOBAL.test(rawLines[i + 1])) {
      const next = rawLines[i + 1].trim();
      
      // Heuristic: Next line starts with uppercase letter and has at least 3 characters
      // and doesn't look like an address (no RUA, AV, etc.)
      if (/^[A-ZÀ-Ú][A-Za-zÀ-ú\s]{2,}$/.test(next) && 
          !/\b(RUA|AV|AVENIDA|TRAVESSA|TV|ESTRADA|ROD|RODOVIA|BR|KM|Nº|N°|NUMERO|BAIRRO|SETOR|QUADRA|LOTE|CASA|APT|APARTAMENTO|BLOCO|CEP)\b/i.test(next)) {
        
        // Join next line to current line (append name continuation)
        line = line.trim() + ' ' + next;
        i++; // Skip next line, already consumed
        joinedCount++;
        logger.info('Normalize', `Linha ${i} juntada com seguinte (continuação de nome)`);
      }
    }

    // Strategy 3: If current line has NO tracking code, NO date, NO position,
    // but has name-like content, and previous line had tracking code,
    // this is likely a name continuation that should be appended to previous
    if (normalized.length > 0 && 
        !TRACKING_CODE_GLOBAL.test(line) && 
        !DATE_GLOBAL.test(line) && 
        !POSITION_REGEX.test(line) &&
        /^[A-ZÀ-Ú][A-Za-zÀ-ú\s]{2,}$/.test(line.trim()) &&
        TRACKING_CODE_GLOBAL.test(normalized[normalized.length - 1])) {
      
      // Append to previous line
      normalized[normalized.length - 1] = normalized[normalized.length - 1].trim() + ' ' + line.trim();
      joinedCount++;
      logger.info('Normalize', `Linha ${i + 1} juntada com anterior (continuação detectada)`);
      continue;
    }

    normalized.push(line);
  }

  logger.info('Normalize', `Total de linhas juntadas: ${joinedCount}`, {
    original: rawLines.length,
    normalized: normalized.length
  });

  return normalized;
}


/**
 * Extract packages from raw text content
 */
function parseTextContent(text: string, logger: PDFLogger): PackageData[] {
  const packages: PackageData[] = [];
  const seenCodes = new Set<string>();
  let lineNumber = 0;
  
  // Extract metadata from header
  const returnDateMatch = text.match(/Data de Devolução:\s*(\d{2}\/\d{2}\/\d{4})/);
  const defaultDate = returnDateMatch ? returnDateMatch[1] : null;
  
  const totalMatch = text.match(/Total de objetos:\s*(\d+)/);
  const expectedTotal = totalMatch ? parseInt(totalMatch[1]) : 0;
  
  logger.info('Parse', `Data de Devolução: ${defaultDate || 'não encontrada'}`);
  logger.info('Parse', `Total esperado: ${expectedTotal || 'não informado'}`);
  
  // DEBUG: Log sample of extracted text for debugging
  logger.info('Debug', 'Amostra do texto extraído (primeiros 500 chars):', { 
    sample: text.substring(0, 500).replace(/\n/g, ' | ') 
  });
  
  // Pattern 1: Tabular format with pipes
  // | Grupo | Data | Posição | Objeto | Destinatário |
  const tablePattern = /\|\s*(\d+)\s*\|\s*(\d{2}\/\d{2}\/\d{4})\s*\|\s*([A-Z]{2,4}\s*-\s*\d+)\s*\|\s*([A-Z]{2}\d{9}[A-Z]{2})\s*\|\s*([^|]+)\s*\|/g;
  
  let match;
  while ((match = tablePattern.exec(text)) !== null) {
    const [_, grupo, dateStr, position, trackingCode, recipientRaw] = match;
    lineNumber++;
    
    if (!isValidTrackingCode(trackingCode)) {
      logger.warn('Validation', `Linha ${lineNumber}: Código inválido: ${trackingCode}`);
      continue;
    }
    
    if (seenCodes.has(trackingCode)) {
      logger.warn('Validation', `Linha ${lineNumber}: Código duplicado: ${trackingCode}`);
      continue;
    }
    
    const parsedDate = parseDate(dateStr);
    if (!parsedDate) {
      logger.warn('Validation', `Linha ${lineNumber}: Data inválida: ${dateStr}`);
    }
    
    seenCodes.add(trackingCode);
    
    packages.push({
      lineNumber,
      trackingCode: trackingCode.toUpperCase(),
      recipient: cleanRecipientName(recipientRaw),
      position: cleanPosition(position),
      date: parsedDate?.date || dateStr,
      dateISO: parsedDate?.dateISO || new Date().toISOString().split('T')[0],
      confidence: 100
    });
  }
  
  logger.info('Parse', `Padrão tabular: ${packages.length} encomendas`);
  
  // Pattern 1.5: LDI format without pipes (common in extracted text)
  // Format: "1 08/12/2025 PCM - 120 AN246666127BR Vanusa Novais Rodrigues :RUA..."
  // Also handles: "104/12/2025PCM - 2AN196638130BR LIGIANNE DOS SANTOS AGUIRRE:&"
  if (packages.length === 0) {
    logger.info('Parse', 'Tentando padrão LDI (sem pipes)');
    
    // Regex: número + data + posição + código + nome (mais flexível)
    // Permite espaços opcionais entre elementos
    const ldiPattern = /(\d+)\s*(\d{2}\/\d{2}\/\d{4})\s*([A-Z]{2,4}\s*-\s*\d+)\s*([A-Z]{2}\d{9}[A-Z]{2})\s*([A-ZÀ-Ú][A-ZÀ-Úa-zÀ-ú\s]+?)(?=\s*:|&|___|\s+\d+\s*\d{2}\/|$)/gi;
    
    let ldiMatch;
    while ((ldiMatch = ldiPattern.exec(text)) !== null) {
      const [_, lineNum, dateStr, position, trackingCode, recipientRaw] = ldiMatch;
      lineNumber++;
      
      if (!isValidTrackingCode(trackingCode) || seenCodes.has(trackingCode)) continue;
      
      const parsedDate = parseDate(dateStr);
      seenCodes.add(trackingCode);
      
      const recipient = cleanRecipientName(recipientRaw);
      
      // Skip if it's a header or invalid name
      if (recipient === 'NOME NÃO IDENTIFICADO') {
        logger.warn('Parse', `LDI: Nome não identificado para ${trackingCode}`);
      }
      
      packages.push({
        lineNumber: parseInt(lineNum) || lineNumber,
        trackingCode: trackingCode.toUpperCase(),
        recipient,
        position: cleanPosition(position),
        date: parsedDate?.date || dateStr,
        dateISO: parsedDate?.dateISO || new Date().toISOString().split('T')[0],
        confidence: recipient === 'NOME NÃO IDENTIFICADO' ? 60 : 90
      });
    }
    
    logger.info('Parse', `Padrão LDI: ${packages.length} encomendas`);
  }
  
  // Pattern 2: Fallback - line by line parsing with improved name extraction
  if (packages.length === 0) {
    logger.info('Parse', 'Tentando padrão alternativo (linha por linha com normalização)');
   
    // CRITICAL FIX: Normalize lines to join broken recipient names
    const lines = normalizeLinesForNames(text, logger);
    let debugCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Find tracking codes in line
      const codes = line.match(TRACKING_CODE_GLOBAL) || [];
      
      // DEBUG: Log first 5 lines with tracking codes
      if (codes.length > 0 && debugCount < 5) {
        debugCount++;
        logger.info('Debug', `Linha ${i + 1}: "${line.substring(0, 200)}"`);
      }
      
      for (const code of codes) {
        if (!isValidTrackingCode(code) || seenCodes.has(code)) continue;
        
        lineNumber++;
        
        // Try to extract date from same line
        const dateMatches = line.match(DATE_GLOBAL);
        let dateStr = dateMatches?.[0] || defaultDate || '';
        const parsedDate = parseDate(dateStr);
        
        // Try to extract position
        const positionMatches = line.match(POSITION_REGEX);
        const position = positionMatches?.[0] || '';
        
        // IMPROVED: Multi-strategy name extraction
        let recipient = 'NOME NÃO IDENTIFICADO';
        
        // Strategy 1: Name directly after tracking code (most common)
        // Matches: AN246666127BR VANUSA NOVAIS RODRIGUES
        // Captures everything after code until : or & or ___ or end of line
        // Non-greedy match but ensures we get full names (2-4 words typically)
        const afterCodeMatch = line.match(new RegExp(
          code + '\\s*([A-ZÀ-Ú][A-ZÀ-Úa-zà-ú]+(?:\\s+[A-ZÀ-Úa-zà-ú]+){1,4})(?=\\s*:|\\s*&|\\s*___|\\s*\\||\\s*$)'
        ));
        if (afterCodeMatch && afterCodeMatch[1]) {
          const candidateName = cleanRecipientName(afterCodeMatch[1]);
          if (candidateName !== 'NOME NÃO IDENTIFICADO') {
            recipient = candidateName;
          }
        }
        
        // Strategy 2: Name with prepositions (de/da/dos/das/e)
        // More flexible pattern that allows mixed case
        if (recipient === 'NOME NÃO IDENTIFICADO') {
          const improvedMatch = line.match(new RegExp(
            code + '\\s*([A-ZÀ-Ú][A-ZÀ-Úa-zà-ú]+(?:\\s+(?:de|da|do|dos|das|e|[A-ZÀ-Ú][A-ZÀ-Úa-zà-ú]+))+)(?=\\s*:|\\s*&|\\s*___|\\s*$|\\s*\\|)'
          ));
          if (improvedMatch && improvedMatch[1]) {
            const candidateName = cleanRecipientName(improvedMatch[1]);
            if (candidateName !== 'NOME NÃO IDENTIFICADO') {
              recipient = candidateName;
            }
          }
        }
        
        // Strategy 3: Extract all uppercase words after code (common in LDI format)
        // Matches sequences like: MARIA SUELI COSTA or VANUSA NOVAIS RODRIGUES
        if (recipient === 'NOME NÃO IDENTIFICADO') {
          const upperCaseMatch = line.match(new RegExp(
            code + '\\s*([A-ZÀ-Ú][A-ZÀ-Ú\\s]+?)(?=\\s*:|\\s*&|\\s*___|\\s*$)'
          ));
          if (upperCaseMatch && upperCaseMatch[1]) {
            const candidateName = cleanRecipientName(upperCaseMatch[1]);
            if (candidateName !== 'NOME NÃO IDENTIFICADO' && candidateName.split(' ').length >= 2) {
              recipient = candidateName;
            }
          }
        }
        
        // Strategy 4: Look in the next line (if it doesn't contain a tracking code)
        if (recipient === 'NOME NÃO IDENTIFICADO' && i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          // If next line doesn't contain tracking code, might be name continuation
          if (!TRACKING_CODE_GLOBAL.test(nextLine)) {
            const nameMatch = nextLine.match(/^([A-ZÀ-Ú][A-Za-zÀ-ú\s]{3,50}?)(?:\s*:|$)/);
            if (nameMatch && nameMatch[1]) {
              const candidateName = cleanRecipientName(nameMatch[1]);
              if (candidateName !== 'NOME NÃO IDENTIFICADO') {
                recipient = candidateName;
              }
            }
          }
        }
        
        // Strategy 5: Find any valid name pattern in the line (broader search)
        if (recipient === 'NOME NÃO IDENTIFICADO') {
          // Look for pattern: First Last (with possible middle names)
          // More flexible - allows all caps or mixed case
          const namePatterns = line.match(/[A-ZÀ-Ú][A-ZÀ-Úa-zà-ú]+(?:\s+[A-ZÀ-Úa-zà-ú]+)+/g);
          if (namePatterns) {
            for (const pattern of namePatterns) {
              // Skip if pattern looks like address (contains RUA, AV, etc.)
              if (/\b(RUA|AV|AVENIDA|TRAVESSA|ESTRADA|RODOVIA|BR|KM|RECEBEDOR|ASSINATURA)\b/i.test(pattern)) continue;
              
              // Skip if it's just the tracking code
              if (TRACKING_CODE_REGEX.test(pattern.replace(/\s/g, ''))) continue;
              
              const candidateName = cleanRecipientName(pattern);
              if (candidateName !== 'NOME NÃO IDENTIFICADO' && candidateName.split(' ').length >= 2) {
                recipient = candidateName;
                break;
              }
            }
          }
        }
        
        // Strategy 6: Name BEFORE tracking code (alternative format)
        if (recipient === 'NOME NÃO IDENTIFICADO') {
          const beforeCodeMatch = line.match(/([A-ZÀ-Ú][A-ZÀ-Úa-zà-ú]+(?:\s+(?:de|da|do|dos|das|e|[A-ZÀ-Ú][A-ZÀ-Úa-zà-ú]+))+)\s+[A-Z]{2}\d{9}[A-Z]{2}/);
          if (beforeCodeMatch && beforeCodeMatch[1]) {
            const candidateName = cleanRecipientName(beforeCodeMatch[1]);
            if (candidateName !== 'NOME NÃO IDENTIFICADO') {
              recipient = candidateName;
            }
          }
        }
        
        seenCodes.add(code);
        
        packages.push({
          lineNumber,
          trackingCode: code.toUpperCase(),
          recipient,
          position: cleanPosition(position),
          date: parsedDate?.date || dateStr || new Date().toLocaleDateString('pt-BR'),
          dateISO: parsedDate?.dateISO || new Date().toISOString().split('T')[0],
          confidence: recipient === 'NOME NÃO IDENTIFICADO' ? 40 : 70
        });
      }
    }
    
    logger.info('Parse', `Padrão alternativo: ${packages.length} encomendas`);
  }
  
  // Pattern 3: Last resort - just find all tracking codes
  if (packages.length === 0) {
    logger.warn('Parse', 'Usando extração básica (apenas códigos de rastreio)');
    
    const allCodes = text.match(TRACKING_CODE_GLOBAL) || [];
    const uniqueCodes = [...new Set(allCodes)];
    
    for (const code of uniqueCodes) {
      if (!isValidTrackingCode(code)) continue;
      
      lineNumber++;
      
      packages.push({
        lineNumber,
        trackingCode: code.toUpperCase(),
        recipient: 'NOME NÃO IDENTIFICADO',
        position: '',
        date: defaultDate || new Date().toLocaleDateString('pt-BR'),
        dateISO: parseDate(defaultDate || '')?.dateISO || new Date().toISOString().split('T')[0],
        confidence: 30
      });
    }
    
    logger.info('Parse', `Extração básica: ${packages.length} códigos encontrados`);
  }
  
  // Validate extraction result
  if (expectedTotal > 0 && packages.length !== expectedTotal) {
    const diff = expectedTotal - packages.length;
    if (diff > 0) {
      logger.warn('Validation', `Faltam ${diff} pacotes (${packages.length}/${expectedTotal})`);
    } else {
      logger.warn('Validation', `${Math.abs(diff)} pacotes extras (${packages.length}/${expectedTotal})`);
    }
  }
  
  return packages;
}

// ============= Main Parser Class =============

export class CorreiosPDFParser {
  private logger: PDFLogger;
  private enableCache: boolean;

  constructor(options?: { enableCache?: boolean; enableLogging?: boolean }) {
    this.logger = new PDFLogger(options?.enableLogging ?? true);
    this.enableCache = options?.enableCache ?? true;
  }

  /**
   * Parse a PDF file and extract package data
   */
  async parse(filePath: string): Promise<ParseResult> {
    const startTime = Date.now();
    const fileName = path.basename(filePath);
    
    this.logger.info('Start', `Iniciando processamento: ${fileName}`);
    
    // Initialize result
    const result: ParseResult = {
      success: false,
      totalPackages: 0,
      packages: [],
      errors: [],
      warnings: [],
      metadata: {
        fileName,
        fileSize: 0,
        processingTime: 0,
        strategy: 'none',
        expectedTotal: 0,
        extractedTotal: 0,
        pagesProcessed: 0
      }
    };
    
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(PDFErrorType.FILE_NOT_FOUND);
      }
      
      // Read file
      const buffer = fs.readFileSync(filePath);
      result.metadata.fileSize = buffer.length;
      
      this.logger.info('File', `Arquivo carregado: ${(buffer.length / 1024).toFixed(1)} KB`);
      
      // Check file size (max 10MB)
      if (buffer.length > 10 * 1024 * 1024) {
        throw new Error(PDFErrorType.FILE_TOO_LARGE);
      }
      
      // Check cache
      if (this.enableCache) {
        const cached = await getCachedResult(buffer);
        if (cached) {
          this.logger.info('Cache', 'Usando resultado do cache');
          const cachedResult = cached.result;
          cachedResult.metadata.processingTime = Date.now() - startTime;
          cachedResult.metadata.strategy = 'cache';
          return cachedResult;
        }
      }
      
      // Try extraction strategies in order
      let rawResult: RawTextResult | null = null;
      
      // Strategy 1: pdf-parse v2.x (PDFParse class)
      rawResult = await extractWithPdfParseV2(buffer, this.logger);
      
      // Strategy 2: pdf-parse v1.x (direct import)
      if (!rawResult) {
        rawResult = await extractWithPdfParseV1(buffer, this.logger);
      }
      
      // Strategy 3: pdf-parse direct (require - most compatible)
      if (!rawResult) {
        rawResult = await extractWithPdfParseDirect(buffer, this.logger);
      }
      
      // Strategy 4: pdfjs-dist (last fallback)
      if (!rawResult) {
        rawResult = await extractWithPdfJsDist(buffer, this.logger);
      }
      
      // Check if any strategy worked
      if (!rawResult || !rawResult.text) {
        throw new Error(PDFErrorType.NO_TEXT_CONTENT);
      }
      
      this.logger.info('Extract', `Texto extraído: ${rawResult.text.length} caracteres, ${rawResult.pages} páginas`);
      result.metadata.strategy = rawResult.strategy;
      result.metadata.pagesProcessed = rawResult.pages;
      
      // Parse text content
      const packages = parseTextContent(rawResult.text, this.logger);
      
      // Populate result
      result.success = packages.length > 0;
      result.totalPackages = packages.length;
      result.packages = packages;
      result.metadata.extractedTotal = packages.length;
      
      // Collect warnings from logger
      result.warnings = this.logger.getWarnings().map(w => w.message);
      
      // Extract expected total from text
      const totalMatch = rawResult.text.match(/Total de objetos:\s*(\d+)/);
      if (totalMatch) {
        result.metadata.expectedTotal = parseInt(totalMatch[1]);
      }
      
      // Save to cache
      if (this.enableCache && result.success) {
        await saveToCache(buffer, fileName, result);
      }
      
    } catch (error: any) {
      const errorType = detectPDFError(error);
      this.logger.error('Fatal', errorType, { originalError: error.message });
      result.errors.push(errorType);
      result.success = false;
    }
    
    // Finalize
    result.metadata.processingTime = Date.now() - startTime;
    
    this.logger.info('Complete', `Processamento concluído em ${result.metadata.processingTime}ms`, {
      success: result.success,
      packages: result.totalPackages,
      strategy: result.metadata.strategy
    });
    
    return result;
  }

  /**
   * Parse from buffer directly
   */
  async parseBuffer(buffer: Buffer, fileName: string = 'upload.pdf'): Promise<ParseResult> {
    const tempPath = path.join('/tmp', `pdf-${Date.now()}.pdf`);
    
    try {
      fs.writeFileSync(tempPath, buffer);
      const result = await this.parse(tempPath);
      result.metadata.fileName = fileName;
      return result;
    } finally {
      // Cleanup temp file
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }

  /**
   * Get processing logs
   */
  getLogs() {
    return this.logger.getLogs();
  }
}

export default CorreiosPDFParser;
