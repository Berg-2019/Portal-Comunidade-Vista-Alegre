const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ApiOptions extends RequestInit {
  authenticated?: boolean;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { authenticated = true, ...fetchOptions } = options;

    const headers: HeadersInit = {
      ...(fetchOptions.headers || {}),
    };

    if (!(fetchOptions.body instanceof FormData)) {
      (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    if (authenticated) {
      const token = this.getAuthToken();
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(error.error || error.message || 'Erro na requisição');
    }

    return response.json();
  }

  // Auth methods
  async login(email: string, password: string) {
    const data = await this.request<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      authenticated: false,
    });
    
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    
    return data;
  }

  async logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  async getCurrentUser() {
    return this.request<any>('/api/auth/me');
  }

  async setup(name: string, email: string, password: string) {
    return this.request<any>('/api/auth/setup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
      authenticated: false,
    });
  }

  // Settings methods
  async getSettings() {
    return this.request<Record<string, string>>('/api/settings', { authenticated: false });
  }

  async updateSettings(settings: Record<string, string>) {
    return this.request<{ success: boolean }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // News methods
  async getNews(publishedOnly = false) {
    return this.request<any[]>(`/api/news${publishedOnly ? '?published=true' : ''}`, {
      authenticated: false,
    });
  }

  async getNewsBySlug(slug: string) {
    return this.request<any>(`/api/news/slug/${slug}`, { authenticated: false });
  }

  async createNews(news: any) {
    return this.request<any>('/api/news', {
      method: 'POST',
      body: JSON.stringify(news),
    });
  }

  async updateNews(id: string, news: any) {
    return this.request<any>(`/api/news/${id}`, {
      method: 'PUT',
      body: JSON.stringify(news),
    });
  }

  async deleteNews(id: string) {
    return this.request<{ success: boolean }>(`/api/news/${id}`, {
      method: 'DELETE',
    });
  }

  async getCategories() {
    return this.request<any[]>('/api/news/categories/all', { authenticated: false });
  }
}

export const api = new ApiService(API_BASE_URL);
export default api;
