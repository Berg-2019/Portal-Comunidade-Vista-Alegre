# 📄 Docling PDF Extractor - Integração

Este módulo integra o **Docling** (biblioteca IBM Research) como método principal de extração de dados de PDFs de encomendas dos Correios (LDI - Lista de Distribuição Interna).

## ✨ Funcionalidades

- **Extração Avançada**: Usa IA (TableFormer) para identificar e extrair tabelas
- **Alta Precisão**: Reconhece estrutura de tabelas mesmo em PDFs complexos
- **Fallback Automático**: Se Docling não estiver disponível, usa métodos alternativos (pdf-parse, pdfjs-dist)

## 📋 Requisitos

- Python 3.9 ou superior
- ~2GB de espaço em disco (para modelos de IA do Docling)

## 🚀 Instalação

### Opção 1: Via npm script (recomendado)

```bash
cd backend
npm run setup:python
```

### Opção 2: Manual

```bash
cd backend

# Criar ambiente virtual
python3 -m venv venv

# Ativar ambiente (Linux/macOS)
source venv/bin/activate

# Ativar ambiente (Windows)
venv\Scripts\activate

# Instalar dependências
pip install -r src/services/docling/requirements.txt
```

### Verificar instalação

```bash
npm run docling:check
# ou
python3 -c "import docling; print('Docling OK')"
```

## 📁 Estrutura

```
src/services/docling/
├── README.md              # Esta documentação
├── requirements.txt       # Dependências Python (docling, pandas)
├── pdf_extractor.py       # Extrator genérico de PDF
├── ldi_parser.py          # Parser específico para LDI dos Correios
└── doclingWrapper.ts      # Wrapper TypeScript para chamar Python
```

## 🔧 Como Funciona

### Fluxo de Extração

```
1. Upload de PDF
   ↓
2. CorreiosPDFParser.parse()
   ↓
3. Tenta Docling (Strategy 0 - Principal)
   ├── Se sucesso → Retorna resultado
   └── Se falha → Continua para fallback
   ↓
4. Fallback: pdf-parse v2.x (Strategy 1)
   ↓
5. Fallback: pdf-parse v1.x (Strategy 2)
   ↓
6. Fallback: pdf-parse direct (Strategy 3)
   ↓
7. Fallback: pdfjs-dist (Strategy 4)
```

### Comunicação Node.js ↔ Python

```
Node.js (doclingWrapper.ts)
    │
    ├── spawn('python3', ['ldi_parser.py', pdfPath])
    │
    └── Captura stdout (JSON) e stderr (logs)
           │
           ↓
Python (ldi_parser.py)
    │
    ├── Usa Docling para converter PDF
    ├── Extrai tabelas com TableFormer
    ├── Processa dados (código rastreio, destinatário, etc.)
    │
    └── Retorna JSON via stdout
```

## 📊 Formato de Saída

O parser retorna dados no formato:

```json
{
  "success": true,
  "totalPackages": 70,
  "packages": [
    {
      "lineNumber": 1,
      "trackingCode": "AN246666127BR",
      "recipient": "Vanusa Novais Rodrigues",
      "position": "PCM - 120",
      "date": "08/12/2025",
      "dateISO": "2025-12-08",
      "confidence": 95
    }
  ],
  "errors": [],
  "warnings": [],
  "metadata": {
    "fileName": "ldi.pdf",
    "fileSize": 123456,
    "processingTime": 5000,
    "strategy": "docling",
    "expectedTotal": 70,
    "extractedTotal": 70,
    "pagesProcessed": 3
  }
}
```

## 🐛 Troubleshooting

### Docling não está instalado

```
Erro: Docling não está instalado. Execute: pip install docling pandas
```

**Solução**: Execute `npm run setup:python` ou instale manualmente.

### Python não encontrado

```
Erro: Python não encontrado no sistema
```

**Solução**: Instale Python 3.9+ e certifique-se que está no PATH.

### Primeira execução lenta

A primeira execução pode demorar alguns minutos pois o Docling baixa modelos de IA (~2GB).

### Fallback ativado

Se o Docling não estiver disponível, o sistema usa automaticamente os métodos alternativos (pdf-parse, pdfjs-dist). A extração ainda funciona, mas pode ter menor precisão em tabelas complexas.

## 📚 Referências

- [Docling GitHub](https://github.com/DS4SD/docling)
- [IBM Research - Docling](https://ds4sd.github.io/docling/)
- [TableFormer Paper](https://arxiv.org/abs/2203.01017)

---

**Desenvolvido para o Portal Comunidade Vista Alegre** 🏘️
