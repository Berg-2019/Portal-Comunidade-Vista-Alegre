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
    
    # Remove caracteres especiais comuns no final (:|], :&, |], [], etc)
    cleaned = re.sub(r'[\:\|\[\]\&\}\{]+$', '', cleaned).strip()
    cleaned = re.sub(r'[\:\|\[\]\&\}\{]+', ' ', cleaned)  # No meio também
    
    # Remove underscores
    cleaned = re.sub(r'_+', ' ', cleaned)
    
    # Remove múltiplos espaços
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    
    # Remove caracteres especiais no final novamente (após limpeza)
    cleaned = re.sub(r'[\:\|\[\]\&\}\{\-]+$', '', cleaned).strip()
    
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
    """Extrai pacotes de uma tabela do Docling.
    
    IMPORTANTE: Lida com células mescladas pelo Docling (quebras de página)
    onde múltiplos códigos de rastreio aparecem numa única célula.
    Exemplo: "AB864450494BR AB864452186BR" -> 2 pacotes separados
    """
    packages = []
    
    # Regex para encontrar TODOS os códigos de rastreio numa string
    TRACKING_FINDER = re.compile(r'[A-Z]{2}\d{9}[A-Z]{2}')
    
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
            # Extrair célula de códigos de rastreio
            objeto_cell = ""
            if 'objeto' in col_map and col_map['objeto'] < len(row):
                objeto_cell = str(row[col_map['objeto']]).strip().upper()
            
            # CORREÇÃO: Encontrar TODOS os códigos na célula (lida com células mescladas)
            tracking_codes = TRACKING_FINDER.findall(objeto_cell)
            
            if not tracking_codes:
                continue
            
            # Extrair dados comuns da linha
            raw_recipient = ""
            if 'destinatario' in col_map and col_map['destinatario'] < len(row):
                raw_recipient = str(row[col_map['destinatario']])
            
            # Extrair datas
            date_str = ""
            date_iso = datetime.now().strftime("%Y-%m-%d")
            if 'data' in col_map and col_map['data'] < len(row):
                raw_date = str(row[col_map['data']]).strip()
                date_matches = re.findall(r'\d{2}/\d{2}/\d{4}', raw_date)
                if date_matches:
                    date_str = date_matches[0]
                    parsed = parse_date(date_str)
                    if parsed:
                        date_iso = parsed['dateISO']
            
            # Extrair posições
            positions = []
            if 'posicao' in col_map and col_map['posicao'] < len(row):
                pos_cell = str(row[col_map['posicao']]).strip().upper()
                # Encontrar todas as posições no formato PCM - XXX
                positions = re.findall(r'PCM\s*-\s*\d+', pos_cell)
            
            # Extrair grupos/linhas
            line_numbers = []
            if 'grupo' in col_map and col_map['grupo'] < len(row):
                grupo_cell = str(row[col_map['grupo']]).strip()
                # Encontrar todos os números de grupo
                line_numbers = [int(n) for n in re.findall(r'\d+', grupo_cell)]
            
            # Extrair nomes dos destinatários (podem estar concatenados)
            # Estratégia: dividir por padrões comuns (múltiplos espaços, underscores)
            recipients = []
            if raw_recipient:
                # Tentar dividir por padrões de separação
                # Ex: "MARCIELY DUTRA FLAZINETE LIMA" -> difícil separar sem mais contexto
                # Usamos heurísticas baseadas no número de códigos
                cleaned_full = clean_recipient_name(raw_recipient)
                
                if len(tracking_codes) > 1:
                    # Quando há múltiplos códigos, tentar dividir nomes
                    # Procurar por padrões de separação comuns
                    words = raw_recipient.split()
                    
                    # Heurística: se temos N códigos, tentar dividir em N partes
                    # Assumir que cada nome tem pelo menos 2 palavras
                    if len(words) >= len(tracking_codes) * 2:
                        words_per_name = len(words) // len(tracking_codes)
                        for i in range(len(tracking_codes)):
                            start = i * words_per_name
                            end = start + words_per_name if i < len(tracking_codes) - 1 else len(words)
                            name = clean_recipient_name(' '.join(words[start:end]))
                            recipients.append(name)
                    else:
                        # Não conseguimos dividir, usar o nome completo para todos
                        recipients = [cleaned_full] * len(tracking_codes)
                else:
                    recipients = [cleaned_full]
            
            # Garantir que temos listas do mesmo tamanho
            while len(recipients) < len(tracking_codes):
                recipients.append("NOME NÃO IDENTIFICADO")
            while len(positions) < len(tracking_codes):
                positions.append(positions[-1] if positions else "")
            while len(line_numbers) < len(tracking_codes):
                line_numbers.append(row_idx + len(line_numbers))
            
            # Criar um pacote para CADA código encontrado
            for idx, code in enumerate(tracking_codes):
                if not is_valid_tracking_code(code):
                    continue
                
                packages.append({
                    "lineNumber": line_numbers[idx] if idx < len(line_numbers) else row_idx,
                    "trackingCode": code,
                    "recipient": recipients[idx] if idx < len(recipients) else "NOME NÃO IDENTIFICADO",
                    "position": positions[idx] if idx < len(positions) else "",
                    "date": date_str,
                    "dateISO": date_iso,
                    "confidence": 90 if len(tracking_codes) == 1 else 80  # Menor confiança para células mescladas
                })
            
            if len(tracking_codes) > 1:
                print(f"  ℹ Linha {row_idx}: célula mesclada com {len(tracking_codes)} códigos detectada", file=sys.stderr)
            
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
        
        # NOVO: Extrair data de ENTRADA do cabeçalho (Impresso em: DD/MM/YYYY)
        # Esta é a data de chegada da lista, igual para TODOS os pacotes
        arrival_date_str = None
        arrival_date_iso = None
        arrival_match = re.search(r'Impresso em:\s*(\d{2}/\d{2}/\d{4})', markdown_text)
        if arrival_match:
            arrival_date_str = arrival_match.group(1)
            result["metadata"]["arrivalDate"] = arrival_date_str
            parsed_arrival = parse_date(arrival_date_str)
            if parsed_arrival:
                arrival_date_iso = parsed_arrival['dateISO']
                print(f"📅 Data de Entrada (cabeçalho): {arrival_date_str} ({arrival_date_iso})", file=sys.stderr)
        
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
                print(f"📅 Data de Devolução (cabeçalho): {return_date_str} ({return_date_iso})", file=sys.stderr)
        
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
                
                # Filtrar duplicados e adicionar datas do CABEÇALHO
                for pkg in packages:
                    if pkg["trackingCode"] not in seen_codes:
                        seen_codes.add(pkg["trackingCode"])
                        
                        # IMPORTANTE: Usar data de ENTRADA do cabeçalho para TODOS os pacotes
                        if arrival_date_iso:
                            pkg["date"] = arrival_date_str
                            pkg["dateISO"] = arrival_date_iso
                        
                        # Adicionar data de devolução/prazo de retirada do cabeçalho
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
        
        # FALLBACK: Se faltam pacotes, tentar extrair do texto bruto usando pypdfium2
        expected_total = result["metadata"]["expectedTotal"]
        if expected_total > 0 and len(all_packages) < expected_total:
            missing_count = expected_total - len(all_packages)
            print(f"  ⚠ Faltam {missing_count} pacotes, tentando fallback com pypdfium2...", file=sys.stderr)
            
            try:
                import pypdfium2 as pdfium
                
                # Extrair texto bruto do PDF
                pdf_doc = pdfium.PdfDocument(pdf_path)
                raw_text = ''
                for page in pdf_doc:
                    textpage = page.get_textpage()
                    raw_text += textpage.get_text_bounded()
                
                # Encontrar todos os códigos de rastreio no texto bruto
                TRACKING_FINDER = re.compile(r'[A-Z]{2}\d{9}[A-Z]{2}')
                all_codes_in_pdf = set(TRACKING_FINDER.findall(raw_text))
                
                # Identificar códigos faltantes
                missing_codes = all_codes_in_pdf - seen_codes
                
                if missing_codes:
                    print(f"  ✓ Encontrados {len(missing_codes)} códigos faltantes no texto bruto", file=sys.stderr)
                    
                    # Para cada código faltante, tentar extrair dados da linha
                    for code in missing_codes:
                        # Buscar contexto do código no texto
                        idx = raw_text.find(code)
                        if idx == -1:
                            continue
                        
                        context = raw_text[max(0, idx-100):idx+150]
                        
                        # Tentar extrair dados do contexto
                        # Formato esperado: "92 07/01/2026 PCM - 94 AB864169553BR MELRY COSTA"
                        
                        # Extrair número da linha
                        line_number = len(all_packages) + 1
                        line_match = re.search(r'(\d{1,3})\s+\d{2}/\d{2}/\d{4}.*?' + re.escape(code), context)
                        if line_match:
                            line_number = int(line_match.group(1))
                        
                        # USAR DATA DO CABEÇALHO (já extraída anteriormente)
                        date_str = arrival_date_str or ""
                        date_iso = arrival_date_iso or datetime.now().strftime("%Y-%m-%d")
                        
                        # Extrair posição
                        position = ""
                        pos_match = re.search(r'(PCM\s*-\s*\d+)', context)
                        if pos_match:
                            position = pos_match.group(1)
                        
                        # Extrair nome (texto após o código até quebra de linha ou caracteres especiais)
                        recipient = "NOME NÃO IDENTIFICADO"
                        after_code = context[context.find(code) + len(code):].strip()
                        name_match = re.match(r'[\r\n]*([A-ZÀ-Ú][A-ZÀ-Úa-zà-ú\s]+?)(?=\s*[:\&_\r\n]|$)', after_code)
                        if name_match:
                            recipient = clean_recipient_name(name_match.group(1))
                        
                        pkg = {
                            "lineNumber": line_number,
                            "trackingCode": code,
                            "recipient": recipient,
                            "position": position,
                            "date": date_str,
                            "dateISO": date_iso,
                            "confidence": 60  # Menor confiança para fallback
                        }
                        
                        # Adicionar data de devolução
                        if return_date_iso:
                            pkg["pickupDeadline"] = return_date_iso
                            pkg["pickupDeadlineStr"] = return_date_str
                        else:
                            try:
                                arrival = datetime.fromisoformat(date_iso)
                                deadline = arrival + timedelta(days=7)
                                pkg["pickupDeadline"] = deadline.strftime("%Y-%m-%d")
                                pkg["pickupDeadlineStr"] = deadline.strftime("%d/%m/%Y")
                            except:
                                deadline = datetime.now() + timedelta(days=7)
                                pkg["pickupDeadline"] = deadline.strftime("%Y-%m-%d")
                                pkg["pickupDeadlineStr"] = deadline.strftime("%d/%m/%Y")
                        
                        all_packages.append(pkg)
                        seen_codes.add(code)
                        print(f"    + Fallback: {code} ({recipient})", file=sys.stderr)
                    
                    # Atualizar totais
                    result["packages"] = all_packages
                    result["totalPackages"] = len(all_packages)
                    result["metadata"]["extractedTotal"] = len(all_packages)
                    
            except Exception as e:
                result["warnings"].append(f"Fallback pypdfium2 falhou: {str(e)}")
                print(f"  ⚠ Fallback pypdfium2 falhou: {e}", file=sys.stderr)
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
