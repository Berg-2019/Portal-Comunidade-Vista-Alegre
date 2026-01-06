/**
 * Docling PDF Extractor Module
 * 
 * Exporta as funções principais para extração de PDFs usando Docling
 */

export {
  extractWithDocling,
  extractBufferWithDocling,
  isDoclingAvailable,
  DoclingPackageData,
  DoclingMetadata,
  DoclingParseResult
} from './doclingWrapper';
