#!/bin/bash

# =============================================================================
# Portal Vista Alegre - Script de Inicialização
# =============================================================================
# Uso:
#   ./scripts/setup.sh dev      - Modo desenvolvimento (com logs em tempo real)
#   ./scripts/setup.sh start    - Modo produção (background)
#   ./scripts/setup.sh stop     - Parar todos os containers
#   ./scripts/setup.sh restart  - Reiniciar containers
#   ./scripts/setup.sh status   - Ver status dos serviços
#   ./scripts/setup.sh logs     - Ver logs em tempo real
#   ./scripts/setup.sh backup   - Fazer backup do banco de dados
# =============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Diretório do projeto
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# =============================================================================
# Funções de utilidade
# =============================================================================

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}  Portal Comunitário Vista Alegre${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# =============================================================================
# Verificação de dependências
# =============================================================================

check_dependencies() {
    print_info "Verificando dependências..."
    
    local missing_deps=0
    
    # Verificar Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | cut -d ' ' -f3 | tr -d ',')
        print_success "Docker instalado (v$DOCKER_VERSION)"
    else
        print_error "Docker não encontrado"
        echo "  Instale em: https://docs.docker.com/engine/install/"
        missing_deps=1
    fi
    
    # Verificar Docker Compose
    if command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version | cut -d ' ' -f4 | tr -d ',')
        print_success "Docker Compose instalado (v$COMPOSE_VERSION)"
    elif docker compose version &> /dev/null; then
        COMPOSE_VERSION=$(docker compose version | cut -d ' ' -f4)
        print_success "Docker Compose (plugin) instalado (v$COMPOSE_VERSION)"
        # Usar docker compose ao invés de docker-compose
        COMPOSE_CMD="docker compose"
    else
        print_error "Docker Compose não encontrado"
        echo "  Instale em: https://docs.docker.com/compose/install/"
        missing_deps=1
    fi
    
    # Verificar se Docker está rodando
    if docker info &> /dev/null; then
        print_success "Docker daemon está rodando"
    else
        print_error "Docker daemon não está rodando"
        echo "  Execute: sudo systemctl start docker"
        missing_deps=1
    fi
    
    # Verificar Git (opcional)
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version | cut -d ' ' -f3)
        print_success "Git instalado (v$GIT_VERSION)"
    else
        print_warning "Git não encontrado (opcional)"
    fi
    
    # Verificar curl (para health checks)
    if command -v curl &> /dev/null; then
        print_success "curl instalado"
    else
        print_warning "curl não encontrado (recomendado para health checks)"
    fi
    
    if [ $missing_deps -eq 1 ]; then
        print_error "Dependências faltando. Instale-as e tente novamente."
        exit 1
    fi
    
    echo ""
}

# =============================================================================
# Configuração do ambiente
# =============================================================================

setup_environment() {
    print_info "Configurando ambiente..."
    
    # Criar diretórios necessários
    mkdir -p "$PROJECT_DIR/backups"
    print_success "Diretório de backups criado"
    
    # Verificar se docker-compose.yml existe
    if [ ! -f "$PROJECT_DIR/docker-compose.yml" ]; then
        print_error "docker-compose.yml não encontrado"
        exit 1
    fi
    print_success "docker-compose.yml encontrado"
    
    # Verificar Dockerfiles
    local dockerfiles=("Dockerfile" "backend/Dockerfile" "whatsapp-bot/Dockerfile")
    for dockerfile in "${dockerfiles[@]}"; do
        if [ -f "$PROJECT_DIR/$dockerfile" ]; then
            print_success "$dockerfile encontrado"
        else
            print_error "$dockerfile não encontrado"
            exit 1
        fi
    done
    
    echo ""
}

# =============================================================================
# Verificação de configuração de produção
# =============================================================================

check_production_config() {
    print_info "Verificando configuração de produção..."
    
    local warnings=0
    
    # Verificar se senhas padrão foram alteradas
    if grep -q "postgres_secret_2024" "$PROJECT_DIR/docker-compose.yml"; then
        print_warning "Senha padrão do PostgreSQL detectada!"
        echo "  Altere DB_PASSWORD no docker-compose.yml"
        warnings=1
    fi
    
    if grep -q "your-super-secret-jwt-key-change-in-production" "$PROJECT_DIR/docker-compose.yml"; then
        print_warning "JWT_SECRET padrão detectado!"
        echo "  Altere JWT_SECRET no docker-compose.yml"
        warnings=1
    fi
    
    # Verificar CORS_ORIGIN
    if grep -q "CORS_ORIGIN=http://localhost" "$PROJECT_DIR/docker-compose.yml"; then
        print_warning "CORS_ORIGIN ainda configurado para localhost"
        echo "  Altere para seu domínio de produção"
        warnings=1
    fi
    
    if [ $warnings -eq 0 ]; then
        print_success "Configuração de produção OK"
    else
        echo ""
        read -p "Deseja continuar mesmo assim? (s/N) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Ss]$ ]]; then
            exit 1
        fi
    fi
    
    echo ""
}

# =============================================================================
# Comandos Docker Compose
# =============================================================================

# Definir comando compose (compatibilidade)
COMPOSE_CMD="${COMPOSE_CMD:-docker-compose}"

build_containers() {
    print_info "Construindo containers..."
    $COMPOSE_CMD build
    print_success "Build concluído"
}

start_dev() {
    print_header
    check_dependencies
    setup_environment
    
    print_info "Iniciando em modo DESENVOLVIMENTO..."
    print_info "Os logs serão exibidos em tempo real"
    print_info "Pressione Ctrl+C para parar\n"
    
    $COMPOSE_CMD up --build
}

start_production() {
    print_header
    check_dependencies
    setup_environment
    check_production_config
    
    print_info "Iniciando em modo PRODUÇÃO..."
    
    # Build e start em background
    $COMPOSE_CMD up -d --build
    
    print_success "Containers iniciados em background"
    echo ""
    
    # Aguardar serviços ficarem prontos
    wait_for_services
    
    show_status
}

stop_containers() {
    print_info "Parando containers..."
    $COMPOSE_CMD down
    print_success "Containers parados"
}

restart_containers() {
    print_info "Reiniciando containers..."
    $COMPOSE_CMD restart
    print_success "Containers reiniciados"
    show_status
}

show_logs() {
    print_info "Exibindo logs (Ctrl+C para sair)..."
    $COMPOSE_CMD logs -f
}

# =============================================================================
# Status e Health Checks
# =============================================================================

wait_for_services() {
    print_info "Aguardando serviços ficarem prontos..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo -ne "\r  Tentativa $attempt/$max_attempts..."
        
        # Verificar se todos os containers estão rodando
        if $COMPOSE_CMD ps | grep -q "Up"; then
            # Tentar health check da API
            if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>/dev/null | grep -q "200"; then
                echo ""
                print_success "Todos os serviços estão prontos!"
                return 0
            fi
        fi
        
        sleep 2
        ((attempt++))
    done
    
    echo ""
    print_warning "Timeout aguardando serviços. Verifique os logs."
}

show_status() {
    echo ""
    print_info "Status dos serviços:"
    echo ""
    $COMPOSE_CMD ps
    echo ""
    
    # Health checks
    print_info "Health Checks:"
    
    # Frontend
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:9070 2>/dev/null | grep -q "200"; then
        print_success "Frontend: http://localhost:9070 ✓"
    else
        print_error "Frontend: http://localhost:9070 ✗"
    fi
    
    # API
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>/dev/null | grep -q "200"; then
        print_success "API: http://localhost:3001/api/health ✓"
    else
        print_error "API: http://localhost:3001/api/health ✗"
    fi
    
    # Bot
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/api/health 2>/dev/null | grep -q "200"; then
        print_success "Bot: http://localhost:3002/api/health ✓"
    else
        print_error "Bot: http://localhost:3002/api/health ✗"
    fi
    
    echo ""
}

# =============================================================================
# Backup
# =============================================================================

create_backup() {
    print_info "Criando backup do banco de dados..."
    
    local backup_file="$PROJECT_DIR/backups/vista_alegre_$(date +%Y%m%d_%H%M%S).sql.gz"
    
    # Verificar se o container do banco está rodando
    if ! $COMPOSE_CMD ps db | grep -q "Up"; then
        print_error "Container do banco de dados não está rodando"
        exit 1
    fi
    
    # Criar backup
    docker exec vista-alegre-db pg_dump -U postgres vista_alegre | gzip > "$backup_file"
    
    if [ -f "$backup_file" ]; then
        local size=$(du -h "$backup_file" | cut -f1)
        print_success "Backup criado: $backup_file ($size)"
    else
        print_error "Falha ao criar backup"
        exit 1
    fi
    
    # Limpar backups antigos (manter últimos 7)
    print_info "Limpando backups antigos (mantendo últimos 7)..."
    ls -t "$PROJECT_DIR/backups/"*.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm
    print_success "Limpeza concluída"
}

# =============================================================================
# Help
# =============================================================================

show_help() {
    echo "Portal Vista Alegre - Script de Inicialização"
    echo ""
    echo "Uso: $0 <comando>"
    echo ""
    echo "Comandos disponíveis:"
    echo "  dev       Inicia em modo desenvolvimento (logs em tempo real)"
    echo "  start     Inicia em modo produção (background)"
    echo "  stop      Para todos os containers"
    echo "  restart   Reinicia os containers"
    echo "  status    Mostra status dos serviços"
    echo "  logs      Exibe logs em tempo real"
    echo "  backup    Cria backup do banco de dados"
    echo "  build     Apenas faz build dos containers"
    echo "  help      Exibe esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 dev        # Desenvolvimento local"
    echo "  $0 start      # Deploy em produção"
    echo "  $0 backup     # Backup antes de atualização"
    echo ""
}

# =============================================================================
# Main
# =============================================================================

case "${1:-}" in
    dev)
        start_dev
        ;;
    start|prod|production)
        start_production
        ;;
    stop)
        stop_containers
        ;;
    restart)
        restart_containers
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    backup)
        create_backup
        ;;
    build)
        check_dependencies
        build_containers
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_header
        show_help
        exit 1
        ;;
esac
