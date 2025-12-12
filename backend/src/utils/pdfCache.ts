/**
 * PDFCache - Caching system for processed PDF results
 */

import crypto from 'crypto';
import { query } from '../config/database';

export interface CachedResult {
  id: number;
  file_hash: string;
  original_name: string;
  result: any;
  created_at: Date;
  expires_at: Date;
}

/**
 * Calculate MD5 hash of a buffer
 */
export function calculateHash(buffer: Buffer): string {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

/**
 * Check if a PDF result is cached
 */
export async function getCachedResult(buffer: Buffer): Promise<CachedResult | null> {
  try {
    const hash = calculateHash(buffer);
    
    const result = await query(
      `SELECT * FROM pdf_cache 
       WHERE file_hash = $1 AND expires_at > NOW()`,
      [hash]
    );

    if (result.rows.length > 0) {
      console.log(`✅ Cache hit para PDF (hash: ${hash.substring(0, 8)}...)`);
      return result.rows[0];
    }

    return null;
  } catch (error) {
    console.error('❌ Erro ao verificar cache:', error);
    return null;
  }
}

/**
 * Save PDF result to cache
 */
export async function saveToCache(
  buffer: Buffer,
  originalName: string,
  result: any,
  ttlHours: number = 24
): Promise<boolean> {
  try {
    const hash = calculateHash(buffer);
    
    await query(
      `INSERT INTO pdf_cache (file_hash, original_name, result, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '${ttlHours} hours')
       ON CONFLICT (file_hash) 
       DO UPDATE SET result = $3, expires_at = NOW() + INTERVAL '${ttlHours} hours'`,
      [hash, originalName, JSON.stringify(result)]
    );

    console.log(`✅ Resultado salvo no cache (hash: ${hash.substring(0, 8)}...)`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar no cache:', error);
    return false;
  }
}

/**
 * Clean expired cache entries
 */
export async function cleanExpiredCache(): Promise<number> {
  try {
    // Verificar se tabela existe antes de limpar (evita erro durante startup)
    const tableCheck = await query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'pdf_cache'
      )`
    );

    if (!tableCheck.rows[0]?.exists) {
      // Tabela ainda não existe, pular silenciosamente
      return 0;
    }

    const result = await query(
      `DELETE FROM pdf_cache WHERE expires_at < NOW() RETURNING id`
    );
    
    const deletedCount = result.rowCount || 0;
    if (deletedCount > 0) {
      console.log(`🧹 ${deletedCount} entradas de cache expiradas removidas`);
    }
    
    return deletedCount;
  } catch (error: any) {
    // Silenciar erro 42P01 (table does not exist) durante startup
    if (error.code !== '42P01') {
      console.error('❌ Erro ao limpar cache:', error);
    }
    return 0;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  total: number;
  expired: number;
  active: number;
  sizeBytes: number;
}> {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE expires_at < NOW()) as expired,
        COUNT(*) FILTER (WHERE expires_at >= NOW()) as active,
        COALESCE(SUM(LENGTH(result::text)), 0) as size_bytes
      FROM pdf_cache
    `);

    return {
      total: parseInt(result.rows[0].total),
      expired: parseInt(result.rows[0].expired),
      active: parseInt(result.rows[0].active),
      sizeBytes: parseInt(result.rows[0].size_bytes)
    };
  } catch (error) {
    console.error('❌ Erro ao obter stats do cache:', error);
    return { total: 0, expired: 0, active: 0, sizeBytes: 0 };
  }
}

export default {
  getCachedResult,
  saveToCache,
  cleanExpiredCache,
  getCacheStats,
  calculateHash
};
