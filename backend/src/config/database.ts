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

      -- Insert default categories if not exist
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
    `);

    console.log('✅ Database initialized successfully');
  } finally {
    client.release();
  }
}

export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}
