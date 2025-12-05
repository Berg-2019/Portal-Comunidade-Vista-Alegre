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

  // Business methods
  async registerBusiness(data: FormData) {
    return this.request<{ success: boolean; message: string; business: any }>('/api/businesses/register', {
      method: 'POST',
      body: data,
      authenticated: false,
    });
  }

  async getBusinesses(sponsorsOnly = false) {
    return this.request<any[]>(`/api/businesses${sponsorsOnly ? '?sponsors_only=true' : ''}`, {
      authenticated: false,
    });
  }

  async getBusinessCategories() {
    return this.request<any[]>('/api/businesses/categories', { authenticated: false });
  }

  async getAllBusinesses() {
    return this.request<any[]>('/api/businesses/admin/all');
  }

  async getPendingBusinessCount() {
    return this.request<{ count: number }>('/api/businesses/admin/pending-count');
  }

  async approveBusiness(id: string) {
    return this.request<{ success: boolean }>(`/api/businesses/admin/${id}/approve`, {
      method: 'PUT',
    });
  }

  async rejectBusiness(id: string) {
    return this.request<{ success: boolean }>(`/api/businesses/admin/${id}/reject`, {
      method: 'PUT',
    });
  }

  async updateBusiness(id: string, data: FormData | any) {
    const isFormData = data instanceof FormData;
    return this.request<{ success: boolean; business: any }>(`/api/businesses/admin/${id}`, {
      method: 'PUT',
      body: isFormData ? data : JSON.stringify(data),
    });
  }

  async deleteBusiness(id: string) {
    return this.request<{ success: boolean }>(`/api/businesses/admin/${id}`, {
      method: 'DELETE',
    });
  }

  // Package methods
  async getPackages(search?: string, status?: string) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'ALL') params.append('status', status);
    const queryString = params.toString();
    return this.request<any[]>(`/api/packages${queryString ? `?${queryString}` : ''}`, {
      authenticated: false,
    });
  }

  async getAllPackages() {
    return this.request<any[]>('/api/packages/admin/all');
  }

  async getPackageStats() {
    return this.request<{ total: number; aguardando: number; entregue: number; devolvido: number }>('/api/packages/admin/stats');
  }

  async uploadPackagePdf(formData: FormData) {
    return this.request<{ success: boolean; results: any }>('/api/packages/upload-pdf', {
      method: 'POST',
      body: formData,
    });
  }

  async createPackage(data: { recipient_name: string; tracking_code: string; arrival_date: string; notes?: string }) {
    return this.request<{ success: boolean; package: any }>('/api/packages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePackage(id: string, data: { status?: string; notes?: string }) {
    return this.request<{ success: boolean; package: any }>(`/api/packages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePackage(id: string) {
    return this.request<{ success: boolean }>(`/api/packages/${id}`, {
      method: 'DELETE',
    });
  }

  // Court methods
  async getCourts() {
    return this.request<any[]>('/api/courts', { authenticated: false });
  }

  async getCourtSlots(courtId: number | string, dayOfWeek?: number) {
    const params = dayOfWeek !== undefined ? `?day_of_week=${dayOfWeek}` : '';
    return this.request<{ slots: any[]; maintenancePeriods: any[] }>(`/api/courts/${courtId}/slots${params}`, { authenticated: false });
  }

  async createCourt(data: FormData) {
    return this.request<{ success: boolean; court: any }>('/api/courts', {
      method: 'POST',
      body: data,
    });
  }

  async updateCourt(id: string, data: FormData | any) {
    const isFormData = data instanceof FormData;
    return this.request<{ success: boolean; court: any }>(`/api/courts/${id}`, {
      method: 'PUT',
      body: isFormData ? data : JSON.stringify(data),
    });
  }

  async updateCourtMaintenance(id: string, data: {
    maintenance_mode: boolean;
    maintenance_reason?: string;
    maintenance_start?: string;
    maintenance_end?: string;
  }) {
    return this.request<{ success: boolean; court: any }>(`/api/courts/${id}/maintenance`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async addMaintenancePeriod(courtId: string, data: {
    start_date: string;
    end_date: string;
    start_time?: string;
    end_time?: string;
    reason?: string;
  }) {
    return this.request<{ success: boolean; period: any }>(`/api/courts/${courtId}/maintenance-period`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteMaintenancePeriod(periodId: string) {
    return this.request<{ success: boolean }>(`/api/courts/maintenance-period/${periodId}`, {
      method: 'DELETE',
    });
  }

  async deleteCourt(id: string) {
    return this.request<{ success: boolean }>(`/api/courts/${id}`, {
      method: 'DELETE',
    });
  }

  async addCourtSlot(courtId: string, data: { day_of_week: number; start_time: string; end_time: string }) {
    return this.request<{ success: boolean; slot: any }>(`/api/courts/${courtId}/slots`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCourtSlot(slotId: string, available: boolean) {
    return this.request<{ success: boolean; slot: any }>(`/api/courts/slots/${slotId}`, {
      method: 'PUT',
      body: JSON.stringify({ available }),
    });
  }

  async deleteCourtSlot(slotId: string) {
    return this.request<{ success: boolean }>(`/api/courts/slots/${slotId}`, {
      method: 'DELETE',
    });
  }

  // WhatsApp methods
  async getWhatsAppGroups() {
    return this.request<any[]>('/api/whatsapp/groups', { authenticated: false });
  }

  async getAllWhatsAppGroups() {
    return this.request<any[]>('/api/whatsapp/groups/admin');
  }

  async createWhatsAppGroup(data: {
    name: string;
    description?: string;
    category: string;
    invite_link: string;
    icon?: string;
    member_count?: number;
  }) {
    return this.request<{ success: boolean; group: any }>('/api/whatsapp/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWhatsAppGroup(id: string, data: any) {
    return this.request<{ success: boolean; group: any }>(`/api/whatsapp/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteWhatsAppGroup(id: string) {
    return this.request<{ success: boolean }>(`/api/whatsapp/groups/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService(API_BASE_URL);
export default api;
