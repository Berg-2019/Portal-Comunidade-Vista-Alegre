import axios, { AxiosInstance, AxiosResponse } from 'axios';

export class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ API ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
        return response;
      },
      (error) => {
        console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || 'Network Error'}`);
        throw error;
      }
    );
  }

  async get(endpoint: string): Promise<AxiosResponse> {
    return this.client.get(endpoint);
  }

  async post(endpoint: string, data: any): Promise<AxiosResponse> {
    return this.client.post(endpoint, data);
  }

  async put(endpoint: string, data: any): Promise<AxiosResponse> {
    return this.client.put(endpoint, data);
  }

  async delete(endpoint: string): Promise<AxiosResponse> {
    return this.client.delete(endpoint);
  }
}
