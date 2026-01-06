#!/usr/bin/env python3
"""
LDI Parser - Parser específico para Lista de Distribuição Interna dos Correios
Usa Docling para extrair tabelas e retorna JSON estruturado para o Node.js
"""

import json
import re
import sys
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from docling.document_converter import DocumentConverter


# Regex para código de rastreio brasileiro (XX000000000BR)
TRACKING_CODE_REGEX = re.compile(r'^[A-Z]{2}\d{9}[A-Z]{2}$')

# Regex para data DD/MM/YYYY
DATE_REGEX = re.compile(r'^\d{2}/\d{2}/\d{4}$')


def is_valid_tracking_code(code: str) -> bool:
    """Valida formato do código de rastreio brasileiro."""
    if not code or not isinstance(code, str):
        return False
    return bool(TRACKING_CODE_REGEX.match(code.strip().upper()))


def clean_recipient_name(name: str) -> str:
    """Limpa e normaliza nome do destinatário."""
    if not name or not isinstance(name, str):
        return "NOME NÃO IDENTIFICADO"
    
    cleaned = name.strip()
    
    # Remove caracteres especiais no final (:& etc)
    cleaned = re.sub(r'[:&]+$', '', cleaned).strip()
    
    # Remove underscores
    cleaned = re.sub(r'_+', ' ', cleaned)
    
    # Remove múltiplos espaços
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    
    # Validação mínima
    if len(cleaned) < 3:
        return "NOME NÃO IDENTIFICADO"
    
    return cleaned


def parse_date(date_str: str) -> Optional[Dict[str, str]]:
    """Converte data DD/MM/YYYY para formato ISO."""
    if not date_str or not DATE_REGEX.match(date_str):
        return None
    
    try:
        day, month, year = date_str.split('/')
        day, month, year = int(day), int(month), int(year)
        
        # Validação básica
        if month < 1 or month > 12 or day < 1 or day > 31 or year < 2020 or year > 2100:
            return None
        
        date_iso = f"{year}-{month:02d}-{day:02d}"
        return {"date": date_str, "dateISO": date_iso}
    except:
        return None


def extract_packages_from_table(table_data: List[List[str]]) -> List[Dict[str, Any]]:
    """Extrai pacotes de uma tabela do Docling."""
    packages = []
    
    # Identificar colunas pelo header
    if not table_data or len(table_data) < 2:
        return packages
    
    header = [str(cell).lower().strip() for cell in table_data[0]]
    
    # Mapear índices das colunas
    col_map = {}
    for i, col in enumerate(header):
        if 'grupo' in col:
            col_map['grupo'] = i
        elif 'data' in col and 'receb' not in col:
            col_map['data'] = i
        elif 'posi' in col:
            col_map['posicao'] = i
        elif 'objeto' in col:
            col_map['objeto'] = i
        elif 'destinat' in col:
            col_map['destinatario'] = i
    
    # Se não encontrou colunas essenciais, tentar por posição padrão
    if 'objeto' not in col_map and len(header) >= 5:
        col_map = {
            'grupo': 0,
            'data': 1,
            'posicao': 2,
            'objeto': 3,
            'destinatario': 4
        }
    
    # Processar linhas de dados
    for row_idx, row in enumerate(table_data[1:], start=1):
        try:
            # Extrair código de rastreio
            tracking_code = ""
            if 'objeto' in col_map and col_map['objeto'] < len(row):
                tracking_code = str(row[col_map['objeto']]).strip().upper()
            
            # Validar código
            if not is_valid_tracking_code(tracking_code):
                continue
            
            # Extrair destinatário
            recipient = "NOME NÃO IDENTIFICADO"
            if 'destinatario' in col_map and col_map['destinatario'] < len(row):
                recipient = clean_recipient_name(str(row[col_map['destinatario']]))
            
            # Extrair data
            date_str = ""
            date_iso = datetime.now().strftime("%Y-%m-%d")
            if 'data' in col_map and col_map['data'] < len(row):
                raw_date = str(row[col_map['data']]).strip()
                # Limpar data (pode vir com texto extra como "08/12/2025 PCM -")
                date_match = re.search(r'\d{2}/\d{2}/\d{4}', raw_date)
                if date_match:
                    date_str = date_match.group()
                    parsed = parse_date(date_str)
                    if parsed:
                        date_iso = parsed['dateISO']
            
            # Extrair posição
            position = ""
            if 'posicao' in col_map and col_map['posicao'] < len(row):
                position = str(row[col_map['posicao']]).strip().upper()
            
            # Extrair grupo/linha
            line_number = row_idx
            if 'grupo' in col_map and col_map['grupo'] < len(row):
                try:
                    line_number = int(str(row[col_map['grupo']]).strip())
                except:
                    pass
            
            packages.append({
                "lineNumber": line_number,
                "trackingCode": tracking_code,
                "recipient": recipient,
                "position": position,
                "date": date_str,
                "dateISO": date_iso,
                "confidence": 95 if recipient != "NOME NÃO IDENTIFICADO" else 70
            })
            
        except Exception as e:
            print(f"⚠ Erro ao processar linha {row_idx}: {e}", file=sys.stderr)
            continue
    
    return packages


def parse_ldi_pdf(pdf_path: str) -> Dict[str, Any]:
    """
    Processa PDF de LDI dos Correios e retorna dados estruturados.
    
    Args:
        pdf_path: Caminho para o arquivo PDF
    
    Returns:
        Dicionário com dados extraídos no formato esperado pelo Node.js
    """
    result = {
        "success": False,
        "totalPackages": 0,
        "packages": [],
        "errors": [],
        "warnings": [],
        "metadata": {
            "fileName": Path(pdf_path).name,
            "fileSize": 0,
            "processingTime": 0,
            "strategy": "docling",
            "expectedTotal": 0,
            "extractedTotal": 0,
            "pagesProcessed": 0
        }
    }
    
    start_time = datetime.now()
    
    try:
        pdf_file = Path(pdf_path)
        if not pdf_file.exists():
            result["errors"].append(f"Arquivo não encontrado: {pdf_path}")
            return result
        
        result["metadata"]["fileSize"] = pdf_file.stat().st_size
        
        print(f"📄 Processando LDI: {pdf_file.name}", file=sys.stderr)
        
        # Converter PDF com Docling
        converter = DocumentConverter()
        doc_result = converter.convert(str(pdf_file))
        doc = doc_result.document
        
        # Contar páginas
        if hasattr(doc, 'pages'):
            result["metadata"]["pagesProcessed"] = len(doc.pages)
        
        # Extrair texto para buscar metadados
        markdown_text = doc.export_to_markdown()
        
        # Buscar total esperado no texto
        total_match = re.search(r'Total de objetos:\s*(\d+)', markdown_text)
        if total_match:
            result["metadata"]["expectedTotal"] = int(total_match.group(1))
        
        # Buscar data de devolução (prazo de retirada)
        return_date_str = None
        return_date_iso = None
        return_date_match = re.search(r'Data de Devolução:\s*(\d{2}/\d{2}/\d{4})', markdown_text)
        if return_date_match:
            return_date_str = return_date_match.group(1)
            result["metadata"]["returnDate"] = return_date_str
            # Converter para ISO
            parsed_return = parse_date(return_date_str)
            if parsed_return:
                return_date_iso = parsed_return['dateISO']
                print(f"📅 Data de Devolução extraída: {return_date_str} ({return_date_iso})", file=sys.stderr)
        
        # Processar tabelas
        all_packages = []
        seen_codes = set()
        
        tables = doc.tables
        print(f"📊 Tabelas encontradas: {len(tables)}", file=sys.stderr)
        
        for i, table in enumerate(tables):
            try:
                # Exportar tabela para DataFrame e depois para lista
                df = table.export_to_dataframe()
                table_data = [df.columns.tolist()] + df.values.tolist()
                
                packages = extract_packages_from_table(table_data)
                
                # Filtrar duplicados e adicionar data de devolução
                for pkg in packages:
                    if pkg["trackingCode"] not in seen_codes:
                        seen_codes.add(pkg["trackingCode"])
                        
                        # Adicionar data de devolução/prazo de retirada
                        if return_date_iso:
                            pkg["pickupDeadline"] = return_date_iso
                            pkg["pickupDeadlineStr"] = return_date_str
                        else:
                            # Se não encontrou no PDF, calcular 7 dias após a data de chegada
                            try:
                                arrival = datetime.fromisoformat(pkg["dateISO"])
                                deadline = arrival + timedelta(days=7)
                                pkg["pickupDeadline"] = deadline.strftime("%Y-%m-%d")
                                pkg["pickupDeadlineStr"] = deadline.strftime("%d/%m/%Y")
                            except:
                                # Fallback: 7 dias a partir de hoje
                                deadline = datetime.now() + timedelta(days=7)
                                pkg["pickupDeadline"] = deadline.strftime("%Y-%m-%d")
                                pkg["pickupDeadlineStr"] = deadline.strftime("%d/%m/%Y")
                        
                        all_packages.append(pkg)
                
                print(f"  ✓ Tabela {i+1}: {len(packages)} pacotes extraídos", file=sys.stderr)
                
            except Exception as e:
                result["warnings"].append(f"Erro ao processar tabela {i+1}: {str(e)}")
                print(f"  ⚠ Tabela {i+1}: erro - {e}", file=sys.stderr)
        
        result["packages"] = all_packages
        result["totalPackages"] = len(all_packages)
        result["metadata"]["extractedTotal"] = len(all_packages)
        result["success"] = len(all_packages) > 0
        
        # Verificar se extraiu o total esperado
        if result["metadata"]["expectedTotal"] > 0:
            diff = result["metadata"]["expectedTotal"] - len(all_packages)
            if diff > 0:
                result["warnings"].append(f"Faltam {diff} pacotes ({len(all_packages)}/{result['metadata']['expectedTotal']})")
            elif diff < 0:
                result["warnings"].append(f"{abs(diff)} pacotes extras ({len(all_packages)}/{result['metadata']['expectedTotal']})")
        
    except Exception as e:
        result["errors"].append(str(e))
        print(f"❌ Erro: {e}", file=sys.stderr)
    
    finally:
        end_time = datetime.now()
        result["metadata"]["processingTime"] = int((end_time - start_time).total_seconds() * 1000)
    
    return result


def main():
    """Função principal - recebe caminho do PDF e retorna JSON."""
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Uso: python ldi_parser.py <caminho_do_pdf>"
        }))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    try:
        result = parse_ldi_pdf(pdf_path)
        # Output JSON para stdout (será capturado pelo Node.js)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e),
            "packages": [],
            "totalPackages": 0
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
