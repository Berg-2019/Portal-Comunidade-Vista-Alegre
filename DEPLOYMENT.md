# Guia de Deploy - Portal Vista Alegre

Este documento explica como fazer o deploy do Portal Comunitário Vista Alegre em um servidor próprio usando Docker.

## Pré-requisitos

- Docker e Docker Compose instalados
- Git instalado
- Acesso ao servidor (VM no Proxmox ou similar)
- Domínio configurado (minhavistaalegre.com.br)

## Deploy Rápido

### 1. Clone o repositório

```bash
git clone <URL_DO_REPOSITORIO> vista-alegre-portal
cd vista-alegre-portal
```

### 2. Build e execução

```bash
# Build da imagem
docker-compose build

# Iniciar em background
docker-compose up -d

# Verificar se está rodando
docker-compose ps

# Ver logs
docker-compose logs -f
```

### 3. Acessar

O portal estará disponível em `http://localhost` ou no IP do servidor.

## Configuração de Produção

### SSL com Let's Encrypt (Certbot)

1. Instale o Certbot no servidor:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot
```

2. Gere o certificado:

```bash
sudo certbot certonly --standalone -d minhavistaalegre.com.br -d www.minhavistaalegre.com.br
```

3. Crie o arquivo `nginx-proxy.conf`:

```nginx
server {
    listen 80;
    server_name minhavistaalegre.com.br www.minhavistaalegre.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name minhavistaalegre.com.br www.minhavistaalegre.com.br;

    ssl_certificate /etc/letsencrypt/live/minhavistaalegre.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/minhavistaalegre.com.br/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://web:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

4. Descomente a seção `nginx-proxy` no `docker-compose.yml` e reinicie:

```bash
docker-compose down
docker-compose up -d
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

# Acessar shell do container
docker exec -it vista-alegre-portal sh

# Limpar imagens antigas
docker image prune -a
```

## Estrutura do Projeto

```
├── src/                    # Código fonte React
│   ├── components/         # Componentes reutilizáveis
│   ├── pages/             # Páginas da aplicação
│   ├── data/              # Dados mockados
│   └── types/             # Tipos TypeScript
├── public/                # Arquivos estáticos
├── Dockerfile             # Configuração do Docker
├── docker-compose.yml     # Orquestração de containers
├── nginx.conf             # Configuração do Nginx
└── DEPLOYMENT.md          # Este arquivo
```

## Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Rodar em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## Customização

### Alterar dados mockados

Os dados de exemplo estão em `src/data/mockData.ts`. Para produção, você precisará:

1. Implementar um backend (Node.js, Python, etc.)
2. Criar uma API REST
3. Substituir as importações de `mockData` por chamadas à API

### Alterar WhatsApp

Busque por `5569999999999` nos arquivos e substitua pelo número correto.

### Alterar e-mail

Busque por `contato@minhavistaalegre.com.br` e substitua se necessário.

## Backup e Manutenção

### Renovação automática do SSL

Adicione ao crontab:

```bash
0 0 1 * * certbot renew --quiet && docker-compose restart nginx-proxy
```

### Monitoramento

O endpoint `/health` retorna status 200 quando o serviço está saudável.

## Suporte

Para dúvidas sobre o projeto, entre em contato através do WhatsApp da comunidade.
