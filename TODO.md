# TODO - Integração Docling PDF Extractor

## Plano de Implementação

### 1. ✅ Corrigir Erro de Build (pdfParser.ts)
- [x] Corrigir import do `pdfjs-dist` na linha 339

### 2. ✅ Criar Serviço Python Docling
- [x] `backend/src/services/docling/pdf_extractor.py` - cópia exata do original
- [x] `backend/src/services/docling/requirements.txt` - dependências Python
- [x] `backend/src/services/docling/ldi_parser.py` - parser específico para LDI dos Correios

### 3. ✅ Criar Wrapper TypeScript
- [x] `backend/src/services/docling/doclingWrapper.ts` - chama Python via child_process

### 4. ✅ Integrar no pdfParser.ts
- [x] Adicionar Docling como Strategy 0 (Principal)
- [x] Manter estratégias atuais como fallback (1-4)

### 5. ✅ Atualizar package.json
- [x] Adicionar script setup-python
- [x] Adicionar script docling:check
- [x] Adicionar postinstall message

### 6. ✅ Testar Build
- [x] Verificar se build do backend funciona ✅
- [ ] Testar extração de PDF (requer instalação do Docling)

### 7. ✅ Documentação
- [x] Criar README.md para o módulo Docling

---

## Progresso

- **Início**: 2024
- **Status**: ✅ CONCLUÍDO

## Arquivos Criados/Modificados

### Criados:
- `backend/src/services/docling/requirements.txt`
- `backend/src/services/docling/pdf_extractor.py`
- `backend/src/services/docling/ldi_parser.py`
- `backend/src/services/docling/doclingWrapper.ts`
- `backend/src/services/docling/README.md`

### Modificados:
- `backend/src/utils/pdfParser.ts` - Corrigido erro pdfjs-dist + integração Docling
- `backend/package.json` - Adicionados scripts Python

## Como Usar

### 1. Instalar dependências Python (opcional, mas recomendado)

```bash
cd backend
npm run setup:python
```

### 2. Verificar instalação

```bash
npm run docling:check
```

### 3. O sistema funciona automaticamente

- Se Docling estiver instalado: usa como método principal (mais preciso)
- Se Docling não estiver instalado: usa fallback (pdf-parse, pdfjs-dist)

## Fluxo de Extração

```
Upload PDF → Docling (Python) → Se falhar → pdf-parse → Se falhar → pdfjs-dist
```
