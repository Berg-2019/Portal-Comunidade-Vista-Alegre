# TODO: Correção do Fluxo de Notícias e Upload de Mídia

## Problemas Identificados:
1. ✅ Erro `TypeError: Cannot read properties of undefined (reading 'toLowerCase')` ao atualizar notícias
2. ✅ Imagens não carregam (limite de 5MB muito baixo)
3. ✅ Não é possível fazer upload de vídeos (apenas links do YouTube)

## Tarefas:

### Backend

- [x] 1. Corrigir `backend/src/routes/news.ts`
  - ✅ Verificar se `title` existe antes de gerar slug
  - ✅ Se não existir, buscar o título atual do banco
  - ✅ Preservar valores existentes quando não fornecidos na atualização

- [x] 2. Atualizar `backend/src/middleware/upload.ts`
  - ✅ Aumentar limite para 100MB para vídeos
  - ✅ Aumentar limite para 10MB para imagens
  - ✅ Adicionar tipos de vídeo (MP4, WebM, MOV, AVI, MKV)
  - ✅ Criar configurações separadas para imagens e vídeos

- [x] 3. Atualizar `backend/src/routes/upload.ts`
  - ✅ Adicionar rota para upload de vídeos (`/api/upload/video`)
  - ✅ Criar diretório de vídeos automaticamente
  - ✅ Adicionar rota para obter limites de upload (`/api/upload/limits`)
  - ✅ Atualizar rota de delete para suportar vídeos

- [x] 4. Atualizar `backend/src/config/database.ts`
  - ✅ Adicionar coluna `file_type` na tabela `uploaded_files`
  - ✅ Alterar coluna `size` para BIGINT (suportar arquivos grandes)

### Frontend

- [x] 5. Criar `src/components/admin/VideoUpload.tsx`
  - ✅ Componente para upload de vídeos
  - ✅ Suporte a arrastar e soltar
  - ✅ Preview do vídeo
  - ✅ Barra de progresso
  - ✅ Validação de tipo e tamanho

- [x] 6. Atualizar `src/components/admin/AdminNewsManager.tsx`
  - ✅ Adicionar opção de upload de vídeo
  - ✅ Permitir escolher entre URL do YouTube ou upload
  - ✅ Detectar automaticamente tipo de vídeo ao editar

- [x] 7. Atualizar `src/services/uploadService.ts`
  - ✅ Adicionar método `uploadVideo`
  - ✅ Adicionar método `deleteVideo`
  - ✅ Adicionar método `deleteFile` genérico
  - ✅ Adicionar método `getUploadLimits`
  - ✅ Adicionar helpers de validação

### Testes

- [x] 8. Testar correção do erro de atualização
- [x] 9. Testar upload de imagens maiores
- [x] 10. Testar upload de vídeos

## Status: ✅ CONCLUÍDO

## Configurações Implementadas:
- Tamanho máximo de imagens: 10MB
- Tamanho máximo de vídeos: 100MB
- Tipos de imagem: JPEG, PNG, WebP, GIF
- Tipos de vídeo: MP4, WebM, MOV, AVI, MKV

## Arquivos Modificados:
1. `backend/src/routes/news.ts` - Correção do erro de undefined
2. `backend/src/middleware/upload.ts` - Suporte a vídeos e novos limites
3. `backend/src/routes/upload.ts` - Nova rota de upload de vídeos
4. `backend/src/config/database.ts` - Nova coluna file_type
5. `src/services/uploadService.ts` - Métodos para vídeos
6. `src/components/admin/VideoUpload.tsx` - Novo componente
7. `src/components/admin/AdminNewsManager.tsx` - Interface atualizada

## Próximos Passos:
1. ✅ Reiniciar o backend para aplicar as alterações
2. ✅ Testar o fluxo de criação/edição de notícias
3. ✅ Testar upload de imagens e vídeos

## Resumo Final:
- Backend reconstruído e funcionando na porta 3001
- Frontend reconstruído com novo componente VideoUpload
- Nginx configurado com limite de 110MB e timeouts estendidos
- Todos os containers Docker reiniciados com sucesso
