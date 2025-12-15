/**
 * Test script to validate name extraction from real PDF format
 * Run with: npx tsx src/utils/testNameExtraction.ts
 */

import { cleanRecipientName } from './pdfParser';

// Test cases based on real PDF format
const testCases = [
  {
    input: 'Recebedor 108/12/2025PCM - 120AN246666127BR VANUSA NOVAIS RODRIGUES',
    code: 'AN246666127BR',
    expected: 'Vanusa Novais Rodrigues',
    note: 'Nome com 3 palavras após código'
  },
  {
    input: '___/___/_____ 208/12/2025PCM - 128AN209365661BR EDUARDO RHAINE SCHLOSSER',
    code: 'AN209365661BR',
    expected: 'Eduardo Rhaine Schlosser'
  },
  {
    input: '___/___/_____ 308/12/2025PCM - 129QS413995488BR TANIA ELIANDRA GIRALDI',
    code: 'QS413995488BR',
    expected: 'Tania Eliandra Giraldi'
  },
  {
    input: '___/___/_____ 408/12/2025PCM - 130AN257627345BR JESSE GOMES DA SILVA',
    code: 'AN257627345BR',
    expected: 'Jesse Gomes da Silva'
  },
  {
    input: '___/___/_____ 508/12/2025PCM - 131AN249574155BRMARIA SUELI COSTA:&___/___/_____',
    code: 'AN249574155BR',
    expected: 'Maria Sueli Costa'
  },
  {
    input: 'AN264883573BR NOME NÃO IDENTIFICADO',
    code: 'AN264883573BR',
    expected: 'Nome Não Identificado' // This should fail and we need to extract from somewhere else
  },
  {
    input: 'AN229240382BR NOME NÃO IDENTIFICADO',
    code: 'AN229240382BR',
    expected: 'Nome Não Identificado'
  }
];

console.log('\n🧪 Testando Extração de Nomes do Formato Real do PDF\n');
console.log('='.repeat(80));

let passed = 0;
let failed = 0;

for (const test of testCases) {
  // Extract name using multiple strategies (simulating the parser logic)
  let extractedName = 'NOME NÃO IDENTIFICADO';
  
  // Strategy 1: Exact word count match (2-4 words)
  const exactMatch = test.input.match(new RegExp(
    test.code + '\\s*([A-ZÀ-Ú][A-ZÀ-Úa-zà-ú]+(?:\\s+[A-ZÀ-Úa-zà-ú]+){1,4})(?=\\s*:|\\s*&|\\s*___|\\s*\\||\\s*$)'
  ));
  
  if (exactMatch && exactMatch[1]) {
    extractedName = cleanRecipientName(exactMatch[1]);
  }
  
  // Strategy 2: Greedy match until delimiter
  if (extractedName === 'NOME NÃO IDENTIFICADO') {
    const greedyMatch = test.input.match(new RegExp(
      test.code + '\\s*([A-ZÀ-Ú][A-ZÀ-Úa-zà-ú\\s]+?)(?=\\s*:|\\s*&|\\s*___|\\s*Recebedor|\\s*$)'
    ));
    if (greedyMatch && greedyMatch[1]) {
      const candidate = cleanRecipientName(greedyMatch[1]);
      if (candidate !== 'NOME NÃO IDENTIFICADO') {
        extractedName = candidate;
      }
    }
  }
  
  // Strategy 3: Uppercase-only extraction
  if (extractedName === 'NOME NÃO IDENTIFICADO') {
    const upperRegex = new RegExp(
      test.code + '\\s*([A-ZÀ-Ú][A-ZÀ-Ú\\s]+?)(?=\\s*:|\\s*&|\\s*___|\\s*$)'
    );
    const upperMatch = test.input.match(upperRegex);
    if (upperMatch && upperMatch[1]) {
      const candidate = cleanRecipientName(upperMatch[1]);
      if (candidate !== 'NOME NÃO IDENTIFICADO' && candidate.split(' ').length >= 2) {
        extractedName = candidate;
      }
    }
  }
  
  const success = extractedName === test.expected || 
                  (test.expected === 'Nome Não Identificado' && extractedName === 'NOME NÃO IDENTIFICADO');
  
  if (success) {
    passed++;
    console.log(`✅ ${test.code}`);
    console.log(`   Entrada: "${test.input.substring(0, 80)}..."`);
    console.log(`   Extraído: "${extractedName}"`);
    console.log(`   Esperado: "${test.expected}"`);
  } else {
    failed++;
    console.log(`❌ ${test.code}`);
    console.log(`   Entrada: "${test.input.substring(0, 80)}..."`);
    console.log(`   Extraído: "${extractedName}"`);
    console.log(`   Esperado: "${test.expected}"`);
  }
  console.log('');
}

console.log('='.repeat(80));
console.log(`\n📊 Resultados: ${passed} passou, ${failed} falhou\n`);

if (failed > 0) {
  process.exit(1);
}
