const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export type UploadCategory = 'news' | 'site' | 'courts' | 'general' | 'businesses' | 'diary';
export type FileType = 'image' | 'video';

export interface UploadedFile {
  filename: string;
  originalName: string;
  path: string;
  url: string;
  size: number;
  type?: FileType;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadLimits {
  image: {
    maxSize: number;
    maxSizeMB: number;
    allowedTypes: string[];
  };
  video: {
    maxSize: number;
    maxSizeMB: number;
    allowedTypes: string[];
  };
}

class UploadService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  async uploadImage(
    file: File,
    category: UploadCategory = 'general',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadedFile> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('image', file);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error || 'Erro no upload'));
          } catch {
            reject(new Error('Erro no upload'));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Erro de conexão'));
      });

      xhr.open('POST', `${this.baseUrl}/api/upload/image?category=${category}`);

      const token = this.getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.send(formData);
    });
  }

  async uploadMultipleImages(
    files: File[],
    category: UploadCategory = 'general',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadedFile[]> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.files);
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error || 'Erro no upload'));
          } catch {
            reject(new Error('Erro no upload'));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Erro de conexão'));
      });

      xhr.open('POST', `${this.baseUrl}/api/upload/images?category=${category}`);

      const token = this.getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.send(formData);
    });
  }

  async uploadVideo(
    file: File,
    category: UploadCategory = 'general',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadedFile> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('video', file);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          resolve({ ...response, type: 'video' });
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error || 'Erro no upload do vídeo'));
          } catch {
            reject(new Error('Erro no upload do vídeo'));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Erro de conexão'));
      });

      xhr.open('POST', `${this.baseUrl}/api/upload/video?category=${category}`);

      const token = this.getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.send(formData);
    });
  }

  async deleteFile(filename: string, category: UploadCategory = 'general', type: FileType = 'image'): Promise<void> {
    const token = this.getAuthToken();

    const response = await fetch(
      `${this.baseUrl}/api/upload/${filename}?category=${category}&type=${type}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro ao excluir' }));
      throw new Error(error.error);
    }
  }

  // Alias for backward compatibility
  async deleteImage(filename: string, category: UploadCategory = 'general'): Promise<void> {
    return this.deleteFile(filename, category, 'image');
  }

  async deleteVideo(filename: string, category: UploadCategory = 'general'): Promise<void> {
    return this.deleteFile(filename, category, 'video');
  }

  async listFiles(category?: UploadCategory, type?: FileType): Promise<UploadedFile[]> {
    const token = this.getAuthToken();
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (type) params.append('type', type);

    const queryString = params.toString();
    const url = `${this.baseUrl}/api/upload${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao listar arquivos');
    }

    return response.json();
  }

  async getUploadLimits(): Promise<UploadLimits> {
    const response = await fetch(`${this.baseUrl}/api/upload/limits`);

    if (!response.ok) {
      throw new Error('Erro ao obter limites de upload');
    }

    return response.json();
  }

  // Helper methods for validation
  isValidImageType(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    return allowedTypes.includes(file.type);
  }

  isValidVideoType(file: File): boolean {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
    return allowedTypes.includes(file.type);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const uploadService = new UploadService(API_BASE_URL);
export default uploadService;
