# Guia de Deploy - Portal Vista Alegre

Este documento explica como fazer o deploy do Portal Comunitário Vista Alegre em um servidor próprio usando Docker.

## Arquitetura

O projeto utiliza arquitetura de microserviços com os seguintes containers:

| Serviço | Porta Interna | Porta Externa | Descrição |
|---------|---------------|---------------|-----------|
| web | 80 | 9070 | Frontend React (Nginx) |
| api | 3001 | 3001 | Backend Node.js/Express |
| whatsapp-bot | 3002 | 3002 | Bot WhatsApp (Baileys) |
| db | 5432 | 5432 | PostgreSQL 15 |

## Pré-requisitos

- Docker e Docker Compose instalados
- Git instalado
- Acesso ao servidor (VM no Proxmox ou similar)
- VM dedicada com Nginx para reverse proxy (recomendado)
- Domínio configurado (minhavistaalegre.com.br)

## Deploy Rápido

### 1. Clone o repositório

```bash
git clone <URL_DO_REPOSITORIO> vista-alegre-portal
cd vista-alegre-portal
```

### 2. Tornar script executável

```bash
chmod +x scripts/setup.sh
```

### 3. Iniciar aplicação

```bash
# Modo desenvolvimento (logs em tempo real)
./scripts/setup.sh dev

# Modo produção (background)
./scripts/setup.sh start
```

### 4. Outros comandos úteis

```bash
./scripts/setup.sh status   # Ver status dos serviços
./scripts/setup.sh logs     # Ver logs em tempo real
./scripts/setup.sh stop     # Parar containers
./scripts/setup.sh restart  # Reiniciar containers
./scripts/setup.sh backup   # Backup do banco de dados
```

### 5. Criar primeiro usuário administrador

Após os containers estarem rodando, crie o primeiro administrador:

```bash
curl -X POST http://localhost:3001/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Administrador",
    "email": "admin@minhavistaalegre.com.br",
    "password": "SuaSenhaSeguraAqui123!"
  }'
```

**⚠️ IMPORTANTE:** Altere a senha para uma senha forte antes de executar!

### 6. Verificar serviços

```bash
# Frontend (porta 9070)
curl http://localhost:9070

# Backend API
curl http://localhost:3001/api/health

# WhatsApp Bot
curl http://localhost:3002/api/health
```

### 7. Primeiro acesso

1. Acesse `http://localhost:9070/admin/login`
2. Use as credenciais criadas no passo 5
3. Configure o número do WhatsApp em **Página → Configurações**

## Configuração com Nginx Reverse Proxy Externo

Esta é a configuração recomendada para produção, usando uma VM dedicada com Nginx como reverse proxy.

### Estrutura de Rede

```
Internet → Nginx VM (443/80) → VM do Projeto
                                ├── Frontend: 9070
                                ├── API: 3001
                                └── Bot: 3002
```

### Configuração do Nginx (na VM dedicada)

Crie o arquivo de configuração em `/etc/nginx/sites-available/minhavistaalegre.com.br`:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name minhavistaalegre.com.br www.minhavistaalegre.com.br;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name minhavistaalegre.com.br www.minhavistaalegre.com.br;

    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/minhavistaalegre.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/minhavistaalegre.com.br/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend (React App)
    location / {
        proxy_pass http://<IP_DA_VM_DO_PROJETO>:9070;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://<IP_DA_VM_DO_PROJETO>:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout para uploads
        client_max_body_size 10M;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WhatsApp Bot API (opcional - apenas se precisar acesso externo)
    location /bot/ {
        proxy_pass http://<IP_DA_VM_DO_PROJETO>:3002/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads estáticos (servidos pelo backend)
    location /uploads/ {
        proxy_pass http://<IP_DA_VM_DO_PROJETO>:3001/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
        
        # Cache para imagens
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Ativar a configuração

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/minhavistaalegre.com.br /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### SSL com Let's Encrypt (na VM do Nginx)

```bash
# Instalar Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Gerar certificado
sudo certbot --nginx -d minhavistaalegre.com.br -d www.minhavistaalegre.com.br

# Renovação automática (adicionar ao crontab)
sudo crontab -e
# Adicionar linha:
0 0 1 * * certbot renew --quiet && systemctl reload nginx
```

## Variáveis de Ambiente

### Produção

Edite as variáveis no `docker-compose.yml` antes do deploy:

```yaml
environment:
  # Backend API
  - NODE_ENV=production
  - PORT=3001
  - DB_HOST=db
  - DB_PORT=5432
  - DB_NAME=vista_alegre
  - DB_USER=postgres
  - DB_PASSWORD=<SENHA_SEGURA_AQUI>
  - JWT_SECRET=<CHAVE_JWT_SEGURA_AQUI>
  - API_BASE_URL=https://minhavistaalegre.com.br
  - CORS_ORIGIN=https://minhavistaalegre.com.br
```

### Gerar senhas seguras

```bash
# Gerar senha para banco de dados
openssl rand -base64 32

# Gerar JWT secret
openssl rand -base64 64
```

## Comandos Úteis

```bash
# Parar containers
docker-compose down

# Rebuild após mudanças
docker-compose build --no-cache
docker-compose up -d

# Ver logs em tempo real
docker-compose logs -f

# Logs de serviço específico
docker-compose logs -f api
docker-compose logs -f whatsapp-bot

# Acessar shell do container
docker exec -it vista-alegre-portal sh
docker exec -it vista-alegre-api sh

# Acessar banco de dados
docker exec -it vista-alegre-db psql -U postgres -d vista_alegre

# Limpar imagens antigas
docker image prune -a

# Ver uso de recursos
docker stats
```

## Backup do Banco de Dados

### Criar backup

```bash
# Backup completo
docker exec vista-alegre-db pg_dump -U postgres vista_alegre > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup compactado
docker exec vista-alegre-db pg_dump -U postgres vista_alegre | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restaurar backup

```bash
# Restaurar
cat backup.sql | docker exec -i vista-alegre-db psql -U postgres -d vista_alegre

# Restaurar compactado
gunzip -c backup.sql.gz | docker exec -i vista-alegre-db psql -U postgres -d vista_alegre
```

### Backup automático (crontab)

```bash
# Adicionar ao crontab do servidor
0 2 * * * docker exec vista-alegre-db pg_dump -U postgres vista_alegre | gzip > /backups/vista_alegre_$(date +\%Y\%m\%d).sql.gz
```

## Monitoramento

### Health Checks

Os endpoints de health check estão disponíveis:

- Frontend: `http://localhost:9070/health`
- API: `http://localhost:3001/api/health`
- Bot: `http://localhost:3002/api/health`

### Verificar status dos containers

```bash
# Status geral
docker-compose ps

# Saúde dos containers
docker inspect --format='{{.State.Health.Status}}' vista-alegre-portal
docker inspect --format='{{.State.Health.Status}}' vista-alegre-api
docker inspect --format='{{.State.Health.Status}}' vista-alegre-db
```

## Troubleshooting

### Container não inicia

```bash
# Ver logs detalhados
docker-compose logs --tail=100 <serviço>

# Verificar se portas estão ocupadas
netstat -tlnp | grep -E '9070|3001|3002|5432'
```

### Erro de conexão com banco

```bash
# Verificar se o banco está rodando
docker-compose ps db

# Testar conexão
docker exec -it vista-alegre-api sh -c "nc -zv db 5432"
```

### Problemas de permissão nos volumes

```bash
# Verificar volumes
docker volume ls

# Inspecionar volume
docker volume inspect vista-alegre-portal_postgres_data
```

## Estrutura do Projeto

```
├── src/                    # Código fonte React (Frontend)
├── backend/                # API Node.js/Express
│   ├── src/
│   │   ├── routes/        # Rotas da API
│   │   ├── middleware/    # Middlewares (auth, upload)
│   │   └── config/        # Configurações
│   └── Dockerfile
├── whatsapp-bot/          # Bot WhatsApp (Baileys)
│   ├── src/
│   │   ├── handlers/      # Handlers de mensagens
│   │   ├── services/      # Serviços (API, sessão)
│   │   └── utils/         # Templates de mensagens
│   └── Dockerfile
├── public/                # Arquivos estáticos
├── Dockerfile             # Dockerfile do frontend
├── docker-compose.yml     # Orquestração de containers
├── nginx.conf             # Configuração do Nginx (frontend)
├── DEPLOYMENT.md          # Este arquivo
└── DATABASE.md            # Documentação do banco de dados
```

## Checklist de Segurança Pré-Deploy

Antes de colocar em produção, verifique:

### Variáveis de Ambiente
- [ ] `JWT_SECRET` definido com chave forte (mínimo 64 caracteres)
- [ ] `DB_PASSWORD` definido com senha forte
- [ ] `CORS_ORIGIN` configurado apenas para o domínio de produção
- [ ] `API_BASE_URL` apontando para o domínio correto

### Nginx/SSL
- [ ] Certificado SSL configurado (Let's Encrypt)
- [ ] Redirect HTTP → HTTPS ativo
- [ ] Headers de segurança configurados (X-Frame-Options, etc.)

### Banco de Dados
- [ ] Backup automático configurado (crontab)
- [ ] Senha do PostgreSQL alterada do padrão

### Aplicação
- [ ] Primeiro admin criado via `/api/auth/setup`
- [ ] Número de WhatsApp configurado nas configurações do site
- [ ] Imagens de capa e logo configuradas

### Gerar senhas seguras

```bash
# Gerar JWT_SECRET (64 caracteres)
openssl rand -base64 64

# Gerar DB_PASSWORD (32 caracteres)
openssl rand -base64 32
```

## Suporte

Para dúvidas sobre o projeto, entre em contato através do WhatsApp da comunidade.
