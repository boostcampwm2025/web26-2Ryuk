import IS from '@/utils/is';
import { ApiResponse } from '@/app/features/room/services/type';
import { showErrorToast } from '@/app/components/shared/toast/useToast';
import useNavigation, { goHome } from '../hooks/useNavigation';
import { useRouter } from 'next/navigation';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
const UUID_PATTERN = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

const MSW_HANDLED_PATHS: string[] = ['/api/posts/popular', '/api/users/:userId/profile'];

function isMswHandled(path: string): boolean {
  if (MSW_HANDLED_PATHS.includes(path)) return true;

  return MSW_HANDLED_PATHS.some((pattern) => {
    const regexPattern = pattern.replace(/:id/g, UUID_PATTERN).replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  });
}

export function isApiResponse(value: unknown): value is ApiResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    'message' in value &&
    typeof (value as ApiResponse).success === 'boolean'
  );
}

export class HttpService {
  private static getBaseUrl(url: string): string {
    // 1. 서버 컴포넌트
    if (typeof window === 'undefined') return 'http://server:4000';

    // 2. 클라이언트 + MSW
    if (isMswHandled(url)) return '';

    // 3. 클라이언트 + 실제 API (rewrites)
    return '';
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

    const baseUrl = this.getBaseUrl(url);
    const fullUrl = baseUrl ? baseUrl + url : url;

    const response = await fetch(fullUrl, requestInit);

    // 204 No Content 응답 처리
    if (response.status === 204) {
      return { success: true, message: 'No Content', data: {} } as T;
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const text = await response.text();
      if (!text || text.trim() === '') return {} as T;
      const parsed = JSON.parse(text) as T;

      // ApiResponse 형식이고 success가 false 이면 Toast 표시
      if (!response.ok && isApiResponse(parsed) && !parsed.success) {
        const errorMessage = parsed.message || '요청에 실패했습니다.';
        showErrorToast(errorMessage);
        goHome();
        throw new Error(errorMessage);
      }

      return parsed;
    }

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
