import IS from '@/utils/is';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class HttpService {
  private static getBaseUrl(): string {
    // 서버 사이드 렌더링에서는 상대 경로 사용
    if (IS.undefined(window)) return '';

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl || apiUrl.trim() === '') return '';

    // NEXT_PUBLIC_API_URL이 설정되어 있으면 그대로 사용
    return apiUrl;
  }

  private static async request<T>(
    url: string,
    method: HttpMethod,
    body?: unknown,
    token?: string,
  ): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const requestInit: RequestInit = {
      method,
      headers,
      credentials: 'include',
    };

    if (!IS.nil(body)) requestInit.body = JSON.stringify(body);

    const baseUrl = this.getBaseUrl();
    const fullUrl = baseUrl ? baseUrl + url : url;
    const response = await fetch(fullUrl, requestInit);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) return response.json();

    return response.text() as T;
  }

  static async get<T>(url: string, token?: string): Promise<T> {
    return this.request<T>(url, 'GET', undefined, token);
  }

  static async post<T>(url: string, data?: unknown, token?: string): Promise<T> {
    return this.request<T>(url, 'POST', data, token);
  }

  static async put<T>(url: string, data?: unknown, token?: string): Promise<T> {
    return this.request<T>(url, 'PUT', data, token);
  }

  static async patch<T>(url: string, data?: unknown, token?: string): Promise<T> {
    return this.request<T>(url, 'PATCH', data, token);
  }

  static async delete<T>(url: string, token?: string): Promise<T> {
    return this.request<T>(url, 'DELETE', undefined, token);
  }
}
