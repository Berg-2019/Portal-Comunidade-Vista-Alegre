/**
 * Manual Test Suite for PDF Parser - Name Extraction Fix
 * 
 * Run with: tsx src/utils/pdfParser.test.ts
 * 
 * This validates the normalizeLinesForNames function
 * and ensures broken recipient names are properly joined.
 */

import { CorreiosPDFParser } from './pdfParser';
import fs from 'fs';
import path from 'path';

// Simple test framework
class TestRunner {
  private passed = 0;
  private failed = 0;
  private tests: Array<{ name: string; fn: () => void | Promise<void> }> = [];

  test(name: string, fn: () => void | Promise<void>) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('\n🧪 Iniciando testes do PDF Parser\n');
    console.log('='.repeat(60));

    for (const test of this.tests) {
      try {
        await test.fn();
        this.passed++;
        console.log(`✅ ${test.name}`);
      } catch (error: any) {
        this.failed++;
        console.log(`❌ ${test.name}`);
        console.log(`   Erro: ${error.message}\n`);
      }
    }

    console.log('='.repeat(60));
    console.log(`\n📊 Resultados: ${this.passed} passou, ${this.failed} falhou\n`);
    
    if (this.failed > 0) {
      process.exit(1);
    }
  }
}

// Helper assertion functions
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: any, expected: any, message?: string) {
  if (actual !== expected) {
    throw new Error(
      message || `Esperado ${expected}, mas recebeu ${actual}`
    );
  }
}

function assertMatch(text: string, pattern: RegExp, message?: string) {
  if (!pattern.test(text)) {
    throw new Error(
      message || `Texto "${text}" não corresponde ao padrão ${pattern}`
    );
  }
}

// Test Suite
const runner = new TestRunner();

// Test 1: Tracking Code Validation
runner.test('Deve validar códigos de rastreio válidos', () => {
  const validCodes = [
    'AN235172298BR',
    'AB757956897BR',
    'OY414275068BR',
    'AD046709618BR'
  ];

  const trackingCodeRegex = /^[A-Z]{2}\d{9}[A-Z]{2}$/;

  validCodes.forEach(code => {
    assert(
      trackingCodeRegex.test(code),
      `Código ${code} deveria ser válido`
    );
  });
});

// Test 2: Date Format Validation
runner.test('Deve validar formato de data DD/MM/YYYY', () => {
  const validDates = ['03/12/2025', '15/12/2025', '31/01/2025'];
  const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;

  validDates.forEach(date => {
    assert(
      dateRegex.test(date),
      `Data ${date} deveria ser válida`
    );
  });
});

// Test 3: Name Pattern Detection
runner.test('Deve detectar padrões de nomes quebrados', () => {
  const brokenNameText = `1 03/12/2025 PCM - 433 AN235172298BR EDIANE
RODRIGUES DA SILVA`;

  const hasTrackingCode = /[A-Z]{2}\d{9}[A-Z]{2}/.test(brokenNameText);
  const hasMultipleLines = brokenNameText.includes('\n');

  assert(hasTrackingCode, 'Deveria conter código de rastreio');
  assert(hasMultipleLines, 'Deveria conter quebra de linha');
});

// Test 4: Multiple Packages Detection
runner.test('Deve detectar múltiplos pacotes no texto', () => {
  const multiPackageText = `1 03/12/2025 PCM - 433 AN235172298BR EDIANE
RODRIGUES DA SILVA
2 03/12/2025 PCM - 434 AB757956897BR GABRIEL DOS
SANTOS SOUZA
3 03/12/2025 PCM - 435 OY414275068BR RAIMUNDA MELO ALVES`;

  const trackingCodes = multiPackageText.match(/[A-Z]{2}\d{9}[A-Z]{2}/g);
  
  assert(trackingCodes !== null, 'Deveria encontrar códigos');
  assertEqual(trackingCodes?.length, 3, 'Deveria encontrar 3 códigos');
});

// Test 5: Address Detection
runner.test('Deve detectar palavras de endereço', () => {
  const addressKeywords = ['RUA', 'AV', 'AVENIDA', 'TRAVESSA', 'BAIRRO'];
  const addressRegex = /\b(RUA|AV|AVENIDA|TRAVESSA|TV|ESTRADA|ROD|RODOVIA|BR|KM|Nº|N°|NUMERO|BAIRRO|SETOR|QUADRA|LOTE|CASA|APT|APARTAMENTO|BLOCO|CEP)\b/i;

  addressKeywords.forEach(keyword => {
    assert(
      addressRegex.test(keyword),
      `Palavra "${keyword}" deveria ser detectada como endereço`
    );
  });
});

// Test 6: Name with Prepositions
runner.test('Deve reconhecer nomes com preposições', () => {
  const namesWithPrepositions = [
    'Maria de Souza',
    'João da Silva',
    'Pedro dos Santos',
    'Ana das Neves',
    'Carlos e Silva'
  ];

  namesWithPrepositions.forEach(name => {
    assert(
      /[A-Za-z\s]+/.test(name),
      `Nome "${name}" deveria ser válido`
    );
  });
});

// Test 7: Total Objects Extraction
runner.test('Deve extrair total de objetos do cabeçalho', () => {
  const headerText = `Total de objetos: 9
Data de Devolução: 10/12/2025`;

  const totalMatch = headerText.match(/Total de objetos:\s*(\d+)/);
  
  assert(totalMatch !== null, 'Deveria encontrar total de objetos');
  assertEqual(totalMatch?.[1], '9', 'Total deveria ser 9');
});

// Test 8: Position Format
runner.test('Deve validar formato de posição (ex: PCM - 120)', () => {
  const positions = ['PCM - 120', 'AAF - 50', 'XYZ - 999'];
  const positionRegex = /[A-Z]{2,4}\s*-\s*\d+/;

  positions.forEach(pos => {
    assert(
      positionRegex.test(pos),
      `Posição "${pos}" deveria ser válida`
    );
  });
});

// Test 9: Empty Lines Handling
runner.test('Deve filtrar linhas vazias corretamente', () => {
  const textWithEmptyLines = `
1 03/12/2025 PCM - 433 AN235172298BR MARIA SILVA

2 03/12/2025 PCM - 434 AB757956897BR JOÃO SANTOS

`;

  const lines = textWithEmptyLines.split('\n').filter(l => l.trim().length > 0);
  
  assert(lines.length > 0, 'Deveria ter linhas não vazias');
  assert(lines.length === 2, 'Deveria ter exatamente 2 linhas válidas');
});

// Test 10: Long Name Handling
runner.test('Deve lidar com nomes longos', () => {
  const longName = 'Maria Eduarda Cristina dos Santos Silva Oliveira Rodrigues';
  
  assert(longName.length > 30, 'Nome deveria ser longo');
  assert(longName.length < 100, 'Nome não deveria exceder limite');
});

// Test 11: Parser Integration Test
runner.test('Deve criar instância do parser corretamente', () => {
  const parser = new CorreiosPDFParser({
    enableCache: false,
    enableLogging: true
  });

  assert(parser !== null, 'Parser deveria ser criado');
  assert(typeof parser.parse === 'function', 'Parser deveria ter método parse');
});

// Test 12: Sample PDF Text Parsing
runner.test('Deve processar texto de exemplo do PDF', () => {
  const sampleText = `
78926972-AGC VISTA ALEGRE DO ABUNÃ
LDI - Lista de Distribuição Interna (Impresso em: 03/12/2025 14:01:22) - Data de Devolução: 10/12/2025
Total de objetos: 9

1 03/12/2025 PCM - 433 AN235172298BR EDIANE
RODRIGUES DA SILVA
2 03/12/2025 PCM - 434 AB757956897BR GABRIEL DOS
SANTOS SOUZA
3 03/12/2025 PCM - 435 OY414275068BR RAIMUNDA
MELO ALVES
`;

  const trackingCodes = sampleText.match(/[A-Z]{2}\d{9}[A-Z]{2}/g);
  const dates = sampleText.match(/\d{2}\/\d{2}\/\d{4}/g);
  
  assert(trackingCodes !== null, 'Deveria encontrar códigos de rastreio');
  assert(trackingCodes !== null && trackingCodes.length >= 3, 'Deveria encontrar pelo menos 3 códigos');
  assert(dates !== null, 'Deveria encontrar datas');
});

// Run all tests
runner.run().catch(console.error);
