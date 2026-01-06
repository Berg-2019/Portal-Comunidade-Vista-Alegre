/**
 * Docling Wrapper - Interface TypeScript para o extrator Python Docling
 * Chama o script Python via child_process e retorna os dados estruturados
 */

import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

// Tipos compatíveis com o pdfParser.ts existente
export interface DoclingPackageData {
  lineNumber: number;
  trackingCode: string;
  recipient: string;
  position: string;
  date: string;
  dateISO: string;
  pickupDeadline?: string;
  pickupDeadlineStr?: string;
  confidence: number;
}

export interface DoclingMetadata {
  fileName: string;
  fileSize: number;
  processingTime: number;
  strategy: string;
  expectedTotal: number;
  extractedTotal: number;
  pagesProcessed: number;
  returnDate?: string;
}

export interface DoclingParseResult {
  success: boolean;
  totalPackages: number;
  packages: DoclingPackageData[];
  errors: string[];
  warnings: string[];
  metadata: DoclingMetadata;
}

// Caminho para o script Python
const PYTHON_SCRIPT_PATH = path.join(__dirname, 'ldi_parser.py');

// Possíveis comandos Python (incluindo venv do Docker)
const PYTHON_COMMANDS = [
  '/opt/venv/bin/python3',  // venv do Docker container
  '/opt/venv/bin/python',   // venv alternativo
  'python3', 
  'python', 
  '/usr/bin/python3', 
  '/usr/local/bin/python3'
];

/**
 * Encontra o comando Python disponível no sistema
 */
async function findPythonCommand(): Promise<string | null> {
  for (const cmd of PYTHON_COMMANDS) {
    try {
      const result = await new Promise<boolean>((resolve) => {
        const proc = spawn(cmd, ['--version']);
        proc.on('close', (code) => resolve(code === 0));
        proc.on('error', () => resolve(false));
      });
      if (result) {
        return cmd;
      }
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Verifica se o Docling está instalado
 */
async function checkDoclingInstalled(pythonCmd: string): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn(pythonCmd, ['-c', 'import docling; print("ok")']);
    let output = '';
    
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    proc.on('close', (code) => {
      resolve(code === 0 && output.includes('ok'));
    });
    
    proc.on('error', () => resolve(false));
  });
}

/**
 * Extrai dados de um PDF usando Docling
 * 
 * @param pdfPath - Caminho para o arquivo PDF
 * @returns Resultado da extração com pacotes e metadados
 */
export async function extractWithDocling(pdfPath: string): Promise<DoclingParseResult> {
  const defaultResult: DoclingParseResult = {
    success: false,
    totalPackages: 0,
    packages: [],
    errors: [],
    warnings: [],
    metadata: {
      fileName: path.basename(pdfPath),
      fileSize: 0,
      processingTime: 0,
      strategy: 'docling',
      expectedTotal: 0,
      extractedTotal: 0,
      pagesProcessed: 0
    }
  };

  // Verificar se o arquivo existe
  if (!fs.existsSync(pdfPath)) {
    defaultResult.errors.push(`Arquivo não encontrado: ${pdfPath}`);
    return defaultResult;
  }

  // Verificar se o script Python existe
  if (!fs.existsSync(PYTHON_SCRIPT_PATH)) {
    defaultResult.errors.push(`Script Python não encontrado: ${PYTHON_SCRIPT_PATH}`);
    return defaultResult;
  }

  // Encontrar Python
  const pythonCmd = await findPythonCommand();
  if (!pythonCmd) {
    defaultResult.errors.push('Python não encontrado no sistema');
    return defaultResult;
  }

  // Verificar se Docling está instalado
  const doclingInstalled = await checkDoclingInstalled(pythonCmd);
  if (!doclingInstalled) {
    defaultResult.errors.push('Docling não está instalado. Execute: pip install docling pandas');
    defaultResult.warnings.push('Fallback para métodos alternativos de extração');
    return defaultResult;
  }

  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';

    console.log(`🐍 Executando Docling: ${pythonCmd} ${PYTHON_SCRIPT_PATH} ${pdfPath}`);

    const proc = spawn(pythonCmd, [PYTHON_SCRIPT_PATH, pdfPath], {
      timeout: 120000, // 2 minutos timeout
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
      // Log stderr em tempo real para debug
      console.log(`📝 Docling: ${data.toString().trim()}`);
    });

    proc.on('close', (code) => {
      const processingTime = Date.now() - startTime;
      console.log(`⏱️ Docling finalizado em ${processingTime}ms (código: ${code})`);

      if (code !== 0) {
        defaultResult.errors.push(`Processo Python terminou com código ${code}`);
        if (stderr) {
          defaultResult.errors.push(stderr.trim());
        }
        defaultResult.metadata.processingTime = processingTime;
        resolve(defaultResult);
        return;
      }

      try {
        // Parse do JSON retornado pelo Python
        const result = JSON.parse(stdout.trim()) as DoclingParseResult;
        result.metadata.processingTime = processingTime;
        
        console.log(`✅ Docling extraiu ${result.totalPackages} pacotes`);
        resolve(result);
      } catch (parseError) {
        defaultResult.errors.push(`Erro ao parsear resposta do Python: ${parseError}`);
        defaultResult.errors.push(`Stdout: ${stdout.substring(0, 500)}`);
        defaultResult.metadata.processingTime = processingTime;
        resolve(defaultResult);
      }
    });

    proc.on('error', (error) => {
      defaultResult.errors.push(`Erro ao executar Python: ${error.message}`);
      defaultResult.metadata.processingTime = Date.now() - startTime;
      resolve(defaultResult);
    });
  });
}

/**
 * Extrai dados de um buffer PDF usando Docling
 * Salva temporariamente o buffer em disco e processa
 * 
 * @param buffer - Buffer do arquivo PDF
 * @param fileName - Nome original do arquivo
 * @returns Resultado da extração
 */
export async function extractBufferWithDocling(buffer: Buffer, fileName: string = 'upload.pdf'): Promise<DoclingParseResult> {
  const tempPath = path.join('/tmp', `docling-${Date.now()}-${fileName}`);
  
  try {
    // Salvar buffer em arquivo temporário
    fs.writeFileSync(tempPath, buffer);
    
    // Processar com Docling
    const result = await extractWithDocling(tempPath);
    result.metadata.fileName = fileName;
    
    return result;
  } finally {
    // Limpar arquivo temporário
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch (e) {
        console.warn(`⚠️ Não foi possível remover arquivo temporário: ${tempPath}`);
      }
    }
  }
}

/**
 * Verifica se o Docling está disponível no sistema
 */
export async function isDoclingAvailable(): Promise<boolean> {
  const pythonCmd = await findPythonCommand();
  if (!pythonCmd) return false;
  
  return checkDoclingInstalled(pythonCmd);
}

export default {
  extractWithDocling,
  extractBufferWithDocling,
  isDoclingAvailable
};
