// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'morador' | 'admin';
  createdAt: string;
}

// News types
export interface NewsCategory {
  id: string;
  name: string;
  slug: string;
}

export interface News {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  categoryId: string;
  category?: NewsCategory;
  imageUrl?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// Occurrence types
export interface OccurrenceCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export type OccurrenceStatus = 'pendente' | 'em_analise' | 'em_andamento' | 'resolvida' | 'rejeitada';

export interface Occurrence {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  category?: OccurrenceCategory;
  location: string;
  status: OccurrenceStatus;
  imageUrls?: string[];
  userId?: string;
  userName?: string;
  published: boolean;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// Business types
export interface BusinessCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface Business {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  category?: BusinessCategory;
  address: string;
  phone?: string;
  whatsapp?: string;
  openingHours?: string;
  imageUrl?: string;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
}

// Contact types
export interface ContactCategory {
  id: string;
  name: string;
  slug: string;
}

export interface UsefulContact {
  id: string;
  name: string;
  categoryId: string;
  category?: ContactCategory;
  phone: string;
  address?: string;
  openingHours?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Court/Quadra types (existing feature)
export interface Court {
  id: string;
  name: string;
  type: string;
  available: boolean;
}

// Package/Encomenda types (existing feature)
export interface Package {
  id: string;
  recipientName: string;
  trackingCode: string;
  status: 'aguardando' | 'retirada' | 'devolvida';
  arrivalDate: string;
  pickupDeadline: string;
}
