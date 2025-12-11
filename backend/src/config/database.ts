import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'vista_alegre',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

export async function initDatabase() {
  const client = await pool.connect();
  
  try {
    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        permissions JSONB DEFAULT '{}',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS news_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        summary TEXT,
        content TEXT NOT NULL,
        category_id INTEGER REFERENCES news_categories(id),
        image_url VARCHAR(500),
        video_url VARCHAR(500),
        published BOOLEAN DEFAULT false,
        author_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS site_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS uploaded_files (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mimetype VARCHAR(100) NOT NULL,
        size INTEGER NOT NULL,
        path VARCHAR(500) NOT NULL,
        category VARCHAR(50) DEFAULT 'general',
        uploaded_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS business_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS businesses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category_id INTEGER REFERENCES business_categories(id),
        address VARCHAR(500),
        location VARCHAR(255),
        phone VARCHAR(20),
        whatsapp VARCHAR(20),
        instagram_url VARCHAR(500),
        website_url VARCHAR(500),
        opening_hours VARCHAR(255),
        image_url VARCHAR(500),
        owner_name VARCHAR(255),
        owner_phone VARCHAR(20),
        is_sponsor BOOLEAN DEFAULT false,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Packages table for mail management
      CREATE TABLE IF NOT EXISTS packages (
        id SERIAL PRIMARY KEY,
        recipient_name VARCHAR(255) NOT NULL,
        tracking_code VARCHAR(50) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'aguardando',
        arrival_date DATE NOT NULL,
        pickup_deadline DATE NOT NULL,
        notes TEXT,
        pdf_source VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Courts table for sports court management
      CREATE TABLE IF NOT EXISTS courts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        description TEXT,
        image_url VARCHAR(500),
        available BOOLEAN DEFAULT TRUE,
        maintenance_mode BOOLEAN DEFAULT FALSE,
        maintenance_reason TEXT,
        maintenance_start DATE,
        maintenance_end DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Court time slots
      CREATE TABLE IF NOT EXISTS court_time_slots (
        id SERIAL PRIMARY KEY,
        court_id INTEGER REFERENCES courts(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Court maintenance periods
      CREATE TABLE IF NOT EXISTS court_maintenance_periods (
        id SERIAL PRIMARY KEY,
        court_id INTEGER REFERENCES courts(id) ON DELETE CASCADE,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- WhatsApp groups for community
      CREATE TABLE IF NOT EXISTS whatsapp_groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        invite_link VARCHAR(500) NOT NULL,
        icon VARCHAR(100),
        member_count INTEGER,
        is_active BOOLEAN DEFAULT TRUE,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Occurrences table for incident reports
      CREATE TABLE IF NOT EXISTS occurrences (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        location VARCHAR(500) NOT NULL,
        reporter_name VARCHAR(255) NOT NULL,
        reporter_phone VARCHAR(20),
        status VARCHAR(20) DEFAULT 'pending',
        priority VARCHAR(20) DEFAULT 'normal',
        image_url VARCHAR(500),
        admin_notes TEXT,
        published BOOLEAN DEFAULT FALSE,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Contact categories table
      CREATE TABLE IF NOT EXISTS contact_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Useful contacts table
      CREATE TABLE IF NOT EXISTS useful_contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category_id INTEGER REFERENCES contact_categories(id),
        phone VARCHAR(50) NOT NULL,
        address VARCHAR(500),
        opening_hours VARCHAR(255),
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Insert default contact categories if not exist
      INSERT INTO contact_categories (name, slug)
      SELECT * FROM (VALUES 
        ('Saúde', 'saude'),
        ('Segurança', 'seguranca'),
        ('Educação', 'educacao'),
        ('Serviços Públicos', 'servicos-publicos'),
        ('Emergência', 'emergencia')
      ) AS v(name, slug)
      WHERE NOT EXISTS (SELECT 1 FROM contact_categories LIMIT 1);

      -- Insert default useful contacts if not exist
      INSERT INTO useful_contacts (name, category_id, phone, address, opening_hours, description)
      SELECT name, (SELECT id FROM contact_categories WHERE slug = cat_slug), phone, address, opening_hours, description
      FROM (VALUES 
        ('Unidade Básica de Saúde Vista Alegre', 'saude', '(69) 3221-1001', 'Rua da Saúde, 100', 'Seg-Sex: 7h-17h', 'Atendimento médico básico, vacinação e acompanhamento.'),
        ('Polícia Militar - 190', 'seguranca', '190', NULL, NULL, 'Emergências policiais.'),
        ('Corpo de Bombeiros - 193', 'emergencia', '193', NULL, NULL, 'Incêndios, resgates e emergências.'),
        ('SAMU - 192', 'emergencia', '192', NULL, NULL, 'Serviço de Atendimento Móvel de Urgência.'),
        ('Escola Municipal Vista Alegre', 'educacao', '(69) 3221-2001', 'Rua da Educação, 200', 'Seg-Sex: 7h-17h', 'Ensino fundamental.'),
        ('CAERD - Companhia de Águas', 'servicos-publicos', '0800 647 0115', NULL, NULL, 'Falta de água, vazamentos, ligações novas.'),
        ('Energisa - Energia Elétrica', 'servicos-publicos', '0800 647 0120', NULL, NULL, 'Falta de energia, problemas na rede.')
      ) AS v(name, cat_slug, phone, address, opening_hours, description)
      WHERE NOT EXISTS (SELECT 1 FROM useful_contacts LIMIT 1);

      -- Insert default news categories if not exist
      INSERT INTO news_categories (name, slug)
      SELECT * FROM (VALUES 
        ('Avisos', 'avisos'),
        ('Eventos', 'eventos'),
        ('Infraestrutura', 'infraestrutura'),
        ('Esportes', 'esportes'),
        ('Saúde', 'saude'),
        ('Educação', 'educacao')
      ) AS v(name, slug)
      WHERE NOT EXISTS (SELECT 1 FROM news_categories LIMIT 1);

      -- Insert default business categories if not exist
      INSERT INTO business_categories (name, slug, icon)
      SELECT * FROM (VALUES 
        ('Alimentação', 'alimentacao', 'utensils'),
        ('Comércio', 'comercio', 'shopping-bag'),
        ('Serviços', 'servicos', 'wrench'),
        ('Saúde', 'saude', 'heart'),
        ('Beleza', 'beleza', 'scissors'),
        ('Educação', 'educacao', 'book'),
        ('Transporte', 'transporte', 'car'),
        ('Outros', 'outros', 'more-horizontal')
      ) AS v(name, slug, icon)
      WHERE NOT EXISTS (SELECT 1 FROM business_categories LIMIT 1);

      -- Insert default settings if not exist
      INSERT INTO site_settings (key, value)
      SELECT * FROM (VALUES 
        ('siteName', 'Vista Alegre do Abunã'),
        ('siteDescription', 'Portal da comunidade de Vista Alegre do Abunã'),
        ('heroTitle', 'Bem-vindo ao Vista Alegre'),
        ('heroSubtitle', 'O portal da nossa comunidade'),
        ('whatsappNumber', '5569999999999'),
        ('primaryColor', '#166534')
      ) AS v(key, value)
      WHERE NOT EXISTS (SELECT 1 FROM site_settings LIMIT 1);

      -- Insert default courts if not exist
      INSERT INTO courts (name, type, description)
      SELECT * FROM (VALUES 
        ('Quadra Poliesportiva Central', 'futsal', 'Quadra coberta para futsal e outros esportes'),
        ('Quadra de Vôlei', 'volei', 'Quadra para vôlei de areia')
      ) AS v(name, type, description)
      WHERE NOT EXISTS (SELECT 1 FROM courts LIMIT 1);

      -- Insert default whatsapp group categories
      INSERT INTO whatsapp_groups (name, description, category, invite_link, icon, order_index)
      SELECT * FROM (VALUES 
        ('Comunidade Vista Alegre', 'Grupo principal da comunidade para avisos gerais', 'geral', 'https://chat.whatsapp.com/exemplo1', 'users', 1),
        ('Comércio Local', 'Divulgação de produtos e serviços locais', 'comercio', 'https://chat.whatsapp.com/exemplo2', 'shopping-bag', 2)
      ) AS v(name, description, category, invite_link, icon, order_index)
      WHERE NOT EXISTS (SELECT 1 FROM whatsapp_groups LIMIT 1);

      -- Fixed schedules table for schools and social projects
      CREATE TABLE IF NOT EXISTS fixed_schedules (
        id SERIAL PRIMARY KEY,
        court_id INTEGER REFERENCES courts(id) ON DELETE CASCADE,
        project_name VARCHAR(255) NOT NULL,
        project_type VARCHAR(50) NOT NULL,
        day_of_week INTEGER NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        responsible VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Court reservations table for individual bookings
      CREATE TABLE IF NOT EXISTS court_reservations (
        id SERIAL PRIMARY KEY,
        court_id INTEGER REFERENCES courts(id) ON DELETE CASCADE,
        slot_id INTEGER REFERENCES court_time_slots(id),
        user_name VARCHAR(255) NOT NULL,
        user_phone VARCHAR(20) NOT NULL,
        reservation_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        status VARCHAR(20) DEFAULT 'confirmed',
        source VARCHAR(20) DEFAULT 'whatsapp',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- PDF cache table for processed results
      CREATE TABLE IF NOT EXISTS pdf_cache (
        id SERIAL PRIMARY KEY,
        file_hash VARCHAR(64) UNIQUE NOT NULL,
        original_name VARCHAR(255),
        result JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours'
      );

      -- Create index for faster cache lookups
      CREATE INDEX IF NOT EXISTS idx_pdf_cache_hash ON pdf_cache(file_hash);
      CREATE INDEX IF NOT EXISTS idx_pdf_cache_expires ON pdf_cache(expires_at);
    `);

    console.log('✅ Database initialized successfully');
  } finally {
    client.release();
  }
}

export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}
