# Estrutura do Banco de Dados PostgreSQL

Este documento descreve a estrutura do banco de dados para o portal Vista Alegre do Abunã.

## Configuração do PostgreSQL

### Docker Compose (adicionar ao docker-compose.yml)

```yaml
services:
  db:
    image: postgres:15-alpine
    container_name: vistaalegre-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: vistaalegre
      POSTGRES_USER: vistaalegre_user
      POSTGRES_PASSWORD: SUA_SENHA_SEGURA_AQUI
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - vistaalegre-network

volumes:
  postgres_data:

networks:
  vistaalegre-network:
    driver: bridge
```

## Tabelas

### 1. users (Usuários Administrativos)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'moderator', -- 'developer', 'admin', 'moderator'
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(active);
```

### 2. user_permissions (Permissões por Usuário)

```sql
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, permission)
);

-- Permissões disponíveis:
-- 'encomendas', 'noticias', 'quadras', 'agendamentos', 'ocorrencias', 'pagina', 'usuarios'

CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);
```

### 3. news_categories (Categorias de Notícias)

```sql
CREATE TABLE news_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. news (Notícias)

```sql
CREATE TABLE news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    category_id UUID REFERENCES news_categories(id),
    image_url TEXT,
    video_url TEXT,
    published BOOLEAN DEFAULT false,
    author_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_news_published ON news(published);
CREATE INDEX idx_news_category ON news(category_id);
CREATE INDEX idx_news_created ON news(created_at DESC);
```

### 5. occurrence_categories (Categorias de Ocorrências)

```sql
CREATE TABLE occurrence_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 6. occurrences (Ocorrências)

```sql
CREATE TABLE occurrences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES occurrence_categories(id),
    location VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pendente', -- 'pendente', 'em_analise', 'em_andamento', 'resolvida', 'rejeitada'
    published BOOLEAN DEFAULT false,
    user_name VARCHAR(255),
    user_phone VARCHAR(50),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_occurrences_status ON occurrences(status);
CREATE INDEX idx_occurrences_published ON occurrences(published);
CREATE INDEX idx_occurrences_created ON occurrences(created_at DESC);
```

### 7. occurrence_images (Imagens de Ocorrências)

```sql
CREATE TABLE occurrence_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    occurrence_id UUID NOT NULL REFERENCES occurrences(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_occurrence_images_occurrence ON occurrence_images(occurrence_id);
```

### 8. courts (Quadras)

```sql
CREATE TABLE courts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'futsal', 'volei', 'basquete', 'society'
    description TEXT,
    image_url TEXT,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 9. time_slots (Horários Disponíveis)

```sql
CREATE TABLE time_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_time_slots_court ON time_slots(court_id);
CREATE INDEX idx_time_slots_day ON time_slots(day_of_week);
```

### 10. fixed_schedules (Agendamentos Fixos)

```sql
CREATE TABLE fixed_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    project_type VARCHAR(50) NOT NULL, -- 'escola', 'projeto_social', 'treino', 'outro'
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    responsible VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fixed_schedules_court ON fixed_schedules(court_id);
CREATE INDEX idx_fixed_schedules_day ON fixed_schedules(day_of_week);
CREATE INDEX idx_fixed_schedules_active ON fixed_schedules(active);
```

### 11. packages (Encomendas)

```sql
CREATE TABLE packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_name VARCHAR(255) NOT NULL,
    tracking_code VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'aguardando', -- 'aguardando', 'retirada', 'devolvida'
    arrival_date DATE NOT NULL,
    pickup_deadline DATE NOT NULL,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_packages_status ON packages(status);
CREATE INDEX idx_packages_tracking ON packages(tracking_code);
CREATE INDEX idx_packages_recipient ON packages(recipient_name);
```

### 12. site_settings (Configurações do Site)

```sql
CREATE TABLE site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configurações padrão
INSERT INTO site_settings (key, value) VALUES
    ('site_name', 'Vista Alegre do Abunã'),
    ('site_description', 'Portal da comunidade de Vista Alegre do Abunã'),
    ('hero_title', 'Bem-vindo ao Vista Alegre'),
    ('hero_subtitle', 'O portal da nossa comunidade'),
    ('cover_image_url', ''),
    ('logo_url', ''),
    ('primary_color', '#166534'),
    ('whatsapp_number', '5569999999999'),
    ('footer_text', '© 2024 Vista Alegre do Abunã. Todos os direitos reservados.');
```

### 13. business_categories (Categorias de Comércios)

```sql
CREATE TABLE business_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 14. businesses (Comércios)

```sql
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES business_categories(id),
    address VARCHAR(255),
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    opening_hours VARCHAR(255),
    image_url TEXT,
    approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_businesses_approved ON businesses(approved);
CREATE INDEX idx_businesses_category ON businesses(category_id);
```

### 15. contact_categories (Categorias de Contatos)

```sql
CREATE TABLE contact_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 16. useful_contacts (Contatos Úteis)

```sql
CREATE TABLE useful_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES contact_categories(id),
    phone VARCHAR(50) NOT NULL,
    address VARCHAR(255),
    opening_hours VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_useful_contacts_category ON useful_contacts(category_id);
```

## Dados Iniciais

```sql
-- Usuário administrador padrão (senha: admin123)
-- IMPORTANTE: Altere a senha após o primeiro acesso!
INSERT INTO users (name, email, password_hash, role) VALUES
    ('Administrador', 'admin@comunidade.com', '$2b$10$HASH_DA_SENHA_AQUI', 'developer');

-- Permissões do admin
INSERT INTO user_permissions (user_id, permission) 
SELECT id, unnest(ARRAY['encomendas', 'noticias', 'quadras', 'agendamentos', 'ocorrencias', 'pagina', 'usuarios'])
FROM users WHERE email = 'admin@comunidade.com';

-- Categorias de notícias
INSERT INTO news_categories (name, slug) VALUES
    ('Comunicados', 'comunicados'),
    ('Eventos', 'eventos'),
    ('Obras', 'obras'),
    ('Utilidade Pública', 'utilidade-publica');

-- Categorias de ocorrências
INSERT INTO occurrence_categories (name, slug, icon) VALUES
    ('Iluminação', 'iluminacao', 'Lightbulb'),
    ('Buracos/Vias', 'buracos-vias', 'Construction'),
    ('Água/Saneamento', 'agua-saneamento', 'Droplets'),
    ('Lixo/Entulho', 'lixo-entulho', 'Trash2'),
    ('Árvores/Vegetação', 'arvores-vegetacao', 'TreePine'),
    ('Outros', 'outros', 'AlertCircle');

-- Categorias de comércios
INSERT INTO business_categories (name, slug, icon) VALUES
    ('Mercado/Mercearia', 'mercado-mercearia', 'ShoppingCart'),
    ('Restaurante/Lanchonete', 'restaurante-lanchonete', 'UtensilsCrossed'),
    ('Oficina/Borracharia', 'oficina-borracharia', 'Wrench'),
    ('Farmácia', 'farmacia', 'Pill'),
    ('Salão de Beleza', 'salao-beleza', 'Scissors'),
    ('Serviços Gerais', 'servicos-gerais', 'Briefcase');

-- Categorias de contatos
INSERT INTO contact_categories (name, slug) VALUES
    ('Saúde', 'saude'),
    ('Segurança', 'seguranca'),
    ('Educação', 'educacao'),
    ('Serviços Públicos', 'servicos-publicos'),
    ('Emergência', 'emergencia');

-- Quadras padrão
INSERT INTO courts (name, type) VALUES
    ('Quadra Poliesportiva Central', 'futsal'),
    ('Quadra de Vôlei', 'volei');
```

## API Backend (Node.js + Express)

Para conectar o frontend ao banco de dados, será necessário criar uma API REST. Recomendações:

### Estrutura de pastas sugerida para o backend:

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── newsController.ts
│   │   ├── occurrencesController.ts
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── permissions.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── news.ts
│   │   └── ...
│   ├── models/
│   │   └── ...
│   └── index.ts
├── package.json
└── Dockerfile
```

### Exemplo de Dockerfile para o backend:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

### Variáveis de ambiente necessárias (.env):

```env
DATABASE_URL=postgresql://vistaalegre_user:SENHA@db:5432/vistaalegre
JWT_SECRET=sua_chave_secreta_jwt_aqui
PORT=3001
```

## Próximos Passos

1. **Criar o backend Node.js** com Express e pg (node-postgres)
2. **Implementar autenticação JWT** para as rotas admin
3. **Adicionar upload de arquivos** (multer + pasta local ou MinIO)
4. **Conectar o frontend** ao backend via API
5. **Configurar o WhatsApp Bot** para receber ocorrências

## Segurança

- Sempre use senhas fortes para o banco de dados
- Nunca exponha a porta 5432 externamente em produção
- Use HTTPS em produção
- Implemente rate limiting na API
- Faça backup regular do banco de dados
