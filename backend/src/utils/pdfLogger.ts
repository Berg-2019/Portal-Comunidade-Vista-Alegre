/**
 * PDFLogger - Structured logging for PDF processing operations
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface ProcessingLog {
  timestamp: string;
  level: LogLevel;
  stage: string;
  message: string;
  details?: any;
  duration?: number;
}

export class PDFLogger {
  private logs: ProcessingLog[] = [];
  private startTime: number;
  private enableConsole: boolean;

  constructor(enableConsole: boolean = true) {
    this.startTime = Date.now();
    this.enableConsole = enableConsole;
  }

  private formatDuration(): string {
    const duration = Date.now() - this.startTime;
    return `+${duration}ms`;
  }

  log(level: LogLevel, stage: string, message: string, details?: any): void {
    const entry: ProcessingLog = {
      timestamp: new Date().toISOString(),
      level,
      stage,
      message,
      details,
      duration: Date.now() - this.startTime
    };

    this.logs.push(entry);

    if (this.enableConsole) {
      const prefix = this.getPrefix(level);
      const durationStr = this.formatDuration();
      console.log(`${prefix} [${durationStr}] ${stage}: ${message}`);
      if (details && level !== 'debug') {
        console.log('   └─', JSON.stringify(details, null, 2).substring(0, 200));
      }
    }
  }

  private getPrefix(level: LogLevel): string {
    switch (level) {
      case 'info': return '📄';
      case 'warn': return '⚠️';
      case 'error': return '❌';
      case 'debug': return '🔍';
      default: return '•';
    }
  }

  info(stage: string, message: string, details?: any): void {
    this.log('info', stage, message, details);
  }

  warn(stage: string, message: string, details?: any): void {
    this.log('warn', stage, message, details);
  }

  error(stage: string, message: string, details?: any): void {
    this.log('error', stage, message, details);
  }

  debug(stage: string, message: string, details?: any): void {
    this.log('debug', stage, message, details);
  }

  getLogs(): ProcessingLog[] {
    return [...this.logs];
  }

  getWarnings(): ProcessingLog[] {
    return this.logs.filter(l => l.level === 'warn');
  }

  getErrors(): ProcessingLog[] {
    return this.logs.filter(l => l.level === 'error');
  }

  getTotalDuration(): number {
    return Date.now() - this.startTime;
  }

  clear(): void {
    this.logs = [];
    this.startTime = Date.now();
  }
}

export default PDFLogger;
