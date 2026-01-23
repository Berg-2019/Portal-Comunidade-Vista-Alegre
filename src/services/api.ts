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

  async createBusiness(data: any) {
    return this.request<{ success: boolean; business: any }>('/api/businesses/admin/create', {
      method: 'POST',
      body: JSON.stringify(data),
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
  async getPackages(params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status && params.status !== 'ALL') queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    const queryString = queryParams.toString();
    return this.request<{
      data: any[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasMore: boolean;
      };
    }>(`/api/packages${queryString ? `?${queryString}` : ''}`, {
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
    return this.request<{ success: boolean; results: { packages: any[]; filename: string } }>('/api/packages/upload-pdf', {
      method: 'POST',
      body: formData,
    });
  }

  async confirmPackageImport(packages: { recipient_name: string; tracking_code: string; arrival_date: string; pickup_deadline?: string }[], pdfFilename: string) {
    return this.request<{ success: boolean; results: { imported: number; duplicates: number; errors: number; details: any[] } }>('/api/packages/confirm-import', {
      method: 'POST',
      body: JSON.stringify({ packages, pdf_filename: pdfFilename }),
    });
  }

  async createPackage(data: { recipient_name: string; tracking_code: string; arrival_date: string; notes?: string }) {
    return this.request<{ success: boolean; package: any }>('/api/packages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePackage(id: string, data: {
    status?: string;
    notes?: string;
    recipient_name?: string;
    tracking_code?: string;
    arrival_date?: string;
    pickup_deadline?: string;
  }) {
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

  async bulkGenerateCourtSlots(courtId: string, data: { day_of_week: number; start_hour: number; end_hour: number }) {
    return this.request<{ success: boolean; slots: any[]; message: string }>(`/api/courts/${courtId}/slots/bulk`, {
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

  // WhatsApp Bot methods
  async getWhatsAppBotStatus(): Promise<{ connected: boolean; phoneNumber?: string; connectionMethod?: string }> {
    return this.request<{ connected: boolean; phoneNumber?: string; connectionMethod?: string }>('/api/whatsapp-bot/status', { authenticated: false });
  }

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

  // Occurrences methods
  async getOccurrences(params?: { category?: string; status?: string; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    const queryString = queryParams.toString();
    return this.request<any[]>(`/api/occurrences${queryString ? `?${queryString}` : ''}`, {
      authenticated: false,
    });
  }

  async createOccurrence(data: {
    title?: string;
    description: string;
    category: string;
    location: string;
    reporter_name: string;
    reporter_phone?: string;
    priority?: string;
    image_url?: string;
  }) {
    return this.request<{ success: boolean; message: string; occurrence: any }>('/api/occurrences', {
      method: 'POST',
      body: JSON.stringify(data),
      authenticated: false,
    });
  }

  async getAllOccurrences(params?: { status?: string; published?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.published !== undefined) queryParams.append('published', String(params.published));
    const queryString = queryParams.toString();
    return this.request<any[]>(`/api/occurrences/admin/all${queryString ? `?${queryString}` : ''}`);
  }

  async getOccurrenceStats() {
    return this.request<{
      total: string;
      pending: string;
      in_progress: string;
      resolved: string;
      rejected: string;
      published: string;
      urgent: string;
      high_priority: string;
    }>('/api/occurrences/admin/stats');
  }

  async getOccurrence(id: string) {
    return this.request<any>(`/api/occurrences/admin/${id}`);
  }

  async updateOccurrence(id: string, data: {
    title?: string;
    description?: string;
    category?: string;
    location?: string;
    status?: string;
    priority?: string;
    admin_notes?: string;
    published?: boolean;
  }) {
    return this.request<any>(`/api/occurrences/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async approveOccurrence(id: string, admin_notes?: string) {
    return this.request<{ success: boolean; occurrence: any }>(`/api/occurrences/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ admin_notes }),
    });
  }

  async rejectOccurrence(id: string, admin_notes?: string) {
    return this.request<{ success: boolean; occurrence: any }>(`/api/occurrences/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ admin_notes }),
    });
  }

  async resolveOccurrence(id: string, admin_notes?: string) {
    return this.request<{ success: boolean; occurrence: any }>(`/api/occurrences/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ admin_notes }),
    });
  }

  async deleteOccurrence(id: string) {
    return this.request<{ success: boolean }>(`/api/occurrences/${id}`, {
      method: 'DELETE',
    });
  }

  async uploadOccurrenceImage(id: string, formData: FormData) {
    return this.request<{ success: boolean; image_url: string; occurrence: any }>(`/api/occurrences/${id}/image`, {
      method: 'POST',
      body: formData,
    });
  }

  // User management methods
  async getUsers() {
    return this.request<any[]>('/api/users');
  }

  async createUser(data: { name: string; email: string; password: string; role: string; permissions: Record<string, boolean> }) {
    return this.request<any>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: { name?: string; email?: string; password?: string; role?: string; permissions?: Record<string, boolean>; active?: boolean }) {
    return this.request<any>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request<{ success: boolean }>(`/api/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Contact methods
  async getContacts(category?: string) {
    const params = category ? `?category=${category}` : '';
    return this.request<any[]>(`/api/contacts${params}`, { authenticated: false });
  }

  async getContactCategories() {
    return this.request<any[]>('/api/contacts/categories', { authenticated: false });
  }

  async createContact(data: { name: string; category_id?: number; phone: string; address?: string; opening_hours?: string; description?: string }) {
    return this.request<{ success: boolean; contact: any }>('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateContact(id: string, data: any) {
    return this.request<{ success: boolean; contact: any }>(`/api/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteContact(id: string) {
    return this.request<{ success: boolean }>(`/api/contacts/${id}`, {
      method: 'DELETE',
    });
  }

  // Schedule methods (fixed schedules for schools/projects)
  async getSchedules(params?: { court_id?: string; day_of_week?: number; active?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.court_id) queryParams.append('court_id', params.court_id);
    if (params?.day_of_week !== undefined) queryParams.append('day_of_week', String(params.day_of_week));
    if (params?.active !== undefined) queryParams.append('active', String(params.active));
    const queryString = queryParams.toString();
    return this.request<any[]>(`/api/schedules${queryString ? `?${queryString}` : ''}`, {
      authenticated: false,
    });
  }

  async createSchedule(data: {
    court_id: number;
    project_name: string;
    project_type: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    responsible: string;
    phone?: string;
  }) {
    return this.request<{ success: boolean; schedule: any }>('/api/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSchedule(id: string, data: any) {
    return this.request<{ success: boolean; schedule: any }>(`/api/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async toggleSchedule(id: string) {
    return this.request<{ success: boolean; schedule: any }>(`/api/schedules/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  async deleteSchedule(id: string) {
    return this.request<{ success: boolean }>(`/api/schedules/${id}`, {
      method: 'DELETE',
    });
  }

  // Reservation methods (individual court bookings)
  async getReservations(params?: { court_id?: string; status?: string; date_from?: string; date_to?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.court_id) queryParams.append('court_id', params.court_id);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    const queryString = queryParams.toString();
    return this.request<any[]>(`/api/reservations${queryString ? `?${queryString}` : ''}`);
  }

  async getReservationStats() {
    return this.request<{
      total: string;
      confirmed: string;
      cancelled: string;
      completed: string;
      today: string;
      upcoming: string;
    }>('/api/reservations/stats');
  }

  async checkAvailability(courtId: string, date: string) {
    return this.request<{ start_time: string; end_time: string }[]>(`/api/reservations/availability/${courtId}/${date}`, {
      authenticated: false,
    });
  }

  async createReservation(data: {
    court_id: number;
    slot_id?: number;
    user_name: string;
    user_phone: string;
    reservation_date: string;
    start_time: string;
    end_time: string;
    source?: string;
    notes?: string;
  }) {
    return this.request<{ success: boolean; reservation: any }>('/api/reservations', {
      method: 'POST',
      body: JSON.stringify(data),
      authenticated: false,
    });
  }

  async updateReservation(id: string, data: { status?: string; notes?: string }) {
    return this.request<{ success: boolean; reservation: any }>(`/api/reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async cancelReservation(id: string) {
    return this.request<{ success: boolean; reservation: any }>(`/api/reservations/${id}/cancel`, {
      method: 'PUT',
      authenticated: false,
    });
  }

  async deleteReservation(id: string) {
    return this.request<{ success: boolean }>(`/api/reservations/${id}`, {
      method: 'DELETE',
    });
  }

  // Diary (Diário de Obras) methods
  async getDiarios(params?: { data_inicio?: string; data_fim?: string; tipo?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.data_inicio) queryParams.append('data_inicio', params.data_inicio);
    if (params?.data_fim) queryParams.append('data_fim', params.data_fim);
    if (params?.tipo) queryParams.append('tipo', params.tipo);
    const queryString = queryParams.toString();
    return this.request<any[]>(`/api/diary${queryString ? `?${queryString}` : ''}`, {
      authenticated: false,
    });
  }

  async getDiario(id: string | number) {
    return this.request<any>(`/api/diary/${id}`, { authenticated: false });
  }

  async getTiposAtividade() {
    return this.request<any[]>('/api/diary/tipos/atividades', { authenticated: false });
  }

  async getDiarioStats() {
    return this.request<any>('/api/diary/admin/stats');
  }

  async createDiario(data: { data: string; observacoes?: string; tempo?: any[] }) {
    return this.request<{ success: boolean; diary: any }>('/api/diary', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDiario(id: string | number, data: { observacoes?: string; tempo?: any[] }) {
    return this.request<{ success: boolean; diary: any }>(`/api/diary/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDiario(id: string | number) {
    return this.request<{ success: boolean }>(`/api/diary/${id}`, {
      method: 'DELETE',
    });
  }

  async createAtividade(diarioId: string | number, data: {
    descricao: string;
    local: string;
    tipo: string;
    status?: string;
    observacoes?: string;
    ordem?: number;
    image_url?: string;
    video_url?: string;
    latitude?: number;
    longitude?: number;
  }) {
    return this.request<{ success: boolean; activity: any }>(`/api/diary/${diarioId}/activities`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAtividade(diarioId: string | number, id: string | number, data: {
    descricao?: string;
    local?: string;
    tipo?: string;
    status?: string;
    observacoes?: string;
    ordem?: number;
    image_url?: string;
    video_url?: string;
    latitude?: number;
    longitude?: number;
  }) {
    return this.request<{ success: boolean; activity: any }>(`/api/diary/${diarioId}/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAtividade(diarioId: string | number, id: string | number) {
    return this.request<{ success: boolean }>(`/api/diary/${diarioId}/activities/${id}`, {
      method: 'DELETE',
    });
  }

  async contestAtividade(atividadeId: string | number, data: {
    nome_morador: string;
    contato?: string;
    mensagem: string;
  }) {
    return this.request<{ success: boolean; message: string; contest: any }>(`/api/diary/activities/${atividadeId}/contest`, {
      method: 'POST',
      body: JSON.stringify(data),
      authenticated: false,
    });
  }

  async getContests(status?: string) {
    const queryString = status ? `?status=${status}` : '';
    return this.request<any[]>(`/api/diary/admin/contests${queryString}`);
  }

  async updateContest(id: string | number, data: { status?: string; resposta_admin?: string }) {
    return this.request<{ success: boolean; contest: any }>(`/api/diary/admin/contests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiService(API_BASE_URL);
export default api;
