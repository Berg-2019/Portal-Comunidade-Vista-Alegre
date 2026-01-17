-- Migration: Diário de Obras Module
-- Created: 2026-01-17
-- Description: Creates tables for construction diary tracking

-- ==================== TABLE: diarios_de_obra ====================
-- One diary entry per day of work
CREATE TABLE IF NOT EXISTS diarios_de_obra (
    id SERIAL PRIMARY KEY,
    data DATE NOT NULL UNIQUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_diarios_data ON diarios_de_obra(data DESC);

-- ==================== TABLE: tempo_diario ====================
-- Weather conditions per period (morning, afternoon, night)
CREATE TABLE IF NOT EXISTS tempo_diario (
    id SERIAL PRIMARY KEY,
    diario_id INTEGER NOT NULL REFERENCES diarios_de_obra(id) ON DELETE CASCADE,
    periodo VARCHAR(20) NOT NULL CHECK (periodo IN ('manha', 'tarde', 'noite')),
    condicao VARCHAR(50) NOT NULL DEFAULT 'ensolarado',
    temperatura_min INTEGER,
    temperatura_max INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(diario_id, periodo)
);

CREATE INDEX idx_tempo_diario_diario ON tempo_diario(diario_id);

-- ==================== TABLE: atividades_obra ====================
-- Activities performed each day
CREATE TABLE IF NOT EXISTS atividades_obra (
    id SERIAL PRIMARY KEY,
    diario_id INTEGER NOT NULL REFERENCES diarios_de_obra(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    local VARCHAR(255) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'pausado', 'cancelado')),
    ordem INTEGER DEFAULT 0,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_atividades_diario ON atividades_obra(diario_id);
CREATE INDEX idx_atividades_status ON atividades_obra(status);
CREATE INDEX idx_atividades_tipo ON atividades_obra(tipo);

-- ==================== TABLE: contestacoes_atividade ====================
-- Public contests of activities
CREATE TABLE IF NOT EXISTS contestacoes_atividade (
    id SERIAL PRIMARY KEY,
    atividade_id INTEGER NOT NULL REFERENCES atividades_obra(id) ON DELETE CASCADE,
    nome_morador VARCHAR(255) NOT NULL,
    contato VARCHAR(100),
    mensagem TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'resolvida', 'rejeitada')),
    resposta_admin TEXT,
    respondido_por INTEGER REFERENCES users(id) ON DELETE SET NULL,
    respondido_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contestacoes_atividade ON contestacoes_atividade(atividade_id);
CREATE INDEX idx_contestacoes_status ON contestacoes_atividade(status);

-- ==================== SEED DATA: Tipos de Atividade ====================
-- Common activity types for construction work
CREATE TABLE IF NOT EXISTS tipos_atividade_obra (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    icone VARCHAR(50),
    cor VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO tipos_atividade_obra (nome, icone, cor) VALUES
    ('Pavimentação', 'road', '#4CAF50'),
    ('Drenagem', 'droplets', '#2196F3'),
    ('Iluminação', 'lightbulb', '#FFC107'),
    ('Sinalização', 'signpost', '#FF9800'),
    ('Limpeza', 'trash', '#9C27B0'),
    ('Manutenção', 'wrench', '#607D8B'),
    ('Construção', 'building', '#795548'),
    ('Paisagismo', 'tree', '#4CAF50'),
    ('Outros', 'circle', '#9E9E9E')
ON CONFLICT (nome) DO NOTHING;

-- ==================== PERMISSION ====================
-- Add 'diario_obras' permission type
INSERT INTO user_permissions (user_id, permission)
SELECT id, 'diario_obras' FROM users WHERE role = 'developer'
ON CONFLICT (user_id, permission) DO NOTHING;
