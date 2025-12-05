const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export type UploadCategory = 'news' | 'site' | 'courts' | 'general';

export interface UploadedFile {
  filename: string;
  originalName: string;
  path: string;
  url: string;
  size: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
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

  async deleteImage(filename: string, category: UploadCategory = 'general'): Promise<void> {
    const token = this.getAuthToken();
    
    const response = await fetch(
      `${this.baseUrl}/api/upload/${filename}?category=${category}`,
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

  async listFiles(category?: UploadCategory): Promise<UploadedFile[]> {
    const token = this.getAuthToken();
    const url = category
      ? `${this.baseUrl}/api/upload?category=${category}`
      : `${this.baseUrl}/api/upload`;

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
}

export const uploadService = new UploadService(API_BASE_URL);
export default uploadService;
