#!/usr/bin/env python3
"""
PDF Extractor usando Docling
Extrai texto e tabelas de documentos PDF.
Baseado no projeto ds-pdf-extractor-with-docling
"""

import json
import sys
from pathlib import Path

from docling.document_converter import DocumentConverter


def extract_pdf(pdf_path: str, output_dir: str = "output"):
    """
    Extrai texto e tabelas de um PDF usando Docling.
    
    Args:
        pdf_path: Caminho para o arquivo PDF
        output_dir: Diretório para salvar os resultados
    
    Returns:
        O documento Docling processado
    """
    pdf_file = Path(pdf_path)
    if not pdf_file.exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {pdf_path}")
    
    # Criar diretórios de saída
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    (output_path / "markdown").mkdir(exist_ok=True)
    (output_path / "json").mkdir(exist_ok=True)
    (output_path / "tables").mkdir(exist_ok=True)
    
    print(f"📄 Processando: {pdf_file.name}", file=sys.stderr)
    print("⏳ Convertendo PDF (pode demorar na primeira execução)...", file=sys.stderr)
    
    # Converter PDF
    converter = DocumentConverter()
    result = converter.convert(str(pdf_file))
    doc = result.document
    
    # Nome base do arquivo
    base_name = pdf_file.stem
    
    # 1. Exportar como Markdown
    markdown_content = doc.export_to_markdown()
    markdown_path = output_path / "markdown" / f"{base_name}.md"
    with open(markdown_path, "w", encoding="utf-8") as f:
        f.write(markdown_content)
    print(f"✓ Texto extraído para: {markdown_path}", file=sys.stderr)
    
    # 2. Exportar como JSON
    json_content = doc.export_to_dict()
    json_path = output_path / "json" / f"{base_name}.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_content, f, indent=2, ensure_ascii=False)
    print(f"✓ JSON exportado para: {json_path}", file=sys.stderr)
    
    # 3. Extrair tabelas
    tables = doc.tables
    if tables:
        for i, table in enumerate(tables):
            try:
                df = table.export_to_dataframe()
                csv_path = output_path / "tables" / f"{base_name}_table_{i+1}.csv"
                df.to_csv(csv_path, index=False)
                print(f"✓ Tabela {i+1} exportada para: {csv_path}", file=sys.stderr)
            except Exception as e:
                print(f"⚠ Erro ao exportar tabela {i+1}: {e}", file=sys.stderr)
    
    print(f"\n📊 Resumo:", file=sys.stderr)
    print(f"   - Páginas processadas: {len(doc.pages) if hasattr(doc, 'pages') else 'N/A'}", file=sys.stderr)
    print(f"   - Tabelas encontradas: {len(tables)}", file=sys.stderr)
    print(f"   - Arquivos salvos em: {output_path.absolute()}", file=sys.stderr)
    
    return doc


def main():
    """Função principal."""
    if len(sys.argv) < 2:
        print("Uso: python pdf_extractor.py <caminho_do_pdf> [diretório_saída]", file=sys.stderr)
        print("\nExemplo:", file=sys.stderr)
        print("  python pdf_extractor.py documento.pdf", file=sys.stderr)
        print("  python pdf_extractor.py documento.pdf ./resultados", file=sys.stderr)
        sys.exit(1)
    
    pdf_file = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "output"
    
    try:
        extract_pdf(pdf_file, output_dir)
        print("\n✅ Extração concluída com sucesso!", file=sys.stderr)
    except FileNotFoundError as e:
        print(f"❌ Erro: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Erro durante a extração: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
