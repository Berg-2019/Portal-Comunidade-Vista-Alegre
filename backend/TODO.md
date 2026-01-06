# TODO - Correção de Datas do PDF

## Problema
O Docling extrai corretamente as datas do PDF (data de entrada e prazo de retirada), mas o frontend sobrescreve essas datas com valores manuais.

## Plano de Correção

- [x] 1. Analisar o fluxo de dados (ldi_parser.py → doclingWrapper.ts → packages.ts → AdminPackagePDFUpload.tsx)
- [x] 2. Editar `AdminPackagePDFUpload.tsx`:
   - [x] Usar as datas extraídas do PDF (`arrival_date`/`dateISO` e `pickup_deadline`/`pickupDeadline`)
   - [x] Remover a seção "Datas do Lote" que sobrescreve as datas
   - [x] Manter a opção de editar individualmente cada encomenda
- [ ] 3. Testar o upload de PDF

## Arquivos Envolvidos
- `backend/src/services/docling/ldi_parser.py` - Extrai datas do PDF ✅
- `backend/src/services/docling/doclingWrapper.ts` - Passa datas corretamente ✅
- `backend/src/routes/packages.ts` - Retorna datas na API ✅
- `src/components/admin/AdminPackagePDFUpload.tsx` - Corrigido ✅

## Alterações Realizadas

### AdminPackagePDFUpload.tsx
1. Removido import de `Calendar` e `Label` (não mais necessários)
2. Removido estados `batchArrivalDate` e `batchPickupDeadline`
3. Alterado mapeamento de pacotes para usar datas do PDF:
   - `arrival_date: pkg.arrival_date || pkg.dateISO || format(new Date(), 'yyyy-MM-dd')`
   - `pickup_deadline: pkg.pickup_deadline || pkg.pickupDeadline || ''`
4. Removida seção "Datas do Lote" da UI
5. Adicionado banner informativo sobre datas extraídas automaticamente
6. Mantida opção de edição individual de cada encomenda
