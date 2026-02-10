import IS from '@/utils/is';
import { ApiResponse } from '@/app/features/room/services/type';
import { toastStore } from '@/app/components/shared/toast/toast.store';
import { AuthService } from '@/app/features/user/services/AuthService';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type HttpRequestOptions = {
  /** true 이면 서버 컴포넌트용 경량 요청 (인증·토스트·리프레시 없음) */
  server?: boolean;
};

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
  private static async request<T>(
    url: string,
    method: HttpMethod,
    body?: unknown,
    isRetry = false,
  ): Promise<T> {
    const token = AuthService.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const requestInit: RequestInit = {
      method,
      headers,
      credentials: 'include',
    };

    if (!IS.nil(body)) requestInit.body = JSON.stringify(body);

    const response = await fetch(url, requestInit);
    const isRefreshRequest = url.includes('/auth/refresh');
    const sessionExpiredMessage = '세션이 만료되었습니다';

    /**
     * 401 Unauthorized
     */
    if (response.status === 401) {
      // refresh 자체가 401 → 세션 만료 확정
      if (isRefreshRequest) throw new Error(sessionExpiredMessage);

      // refresh 시도 자체가 불가능한 상태
      if (!AuthService.canAttemptRefresh()) {
        AuthService.expireSession(sessionExpiredMessage);
        throw new Error(sessionExpiredMessage);
      }

      // 최초 요청이면 refresh 1회 시도
      if (!isRetry) {
        const newToken = await AuthService.runRefresh();
        if (newToken) return this.request<T>(url, method, body, true);

        // refresh 실패 → 세션 만료
        AuthService.expireSession(sessionExpiredMessage);
        throw new Error(sessionExpiredMessage);
      }
    }

    /**
     * 204 No Content
     */
    if (response.status === 204) {
      return { success: true, message: 'No Content' } as T;
    }

    /**
     * JSON이 아닌 응답
     */
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return response.text() as T;
    }

    const text = await response.text();
    if (!text.trim()) {
      return {} as T;
    }

    const parsed = JSON.parse(text) as T;

    /**
     * API 비즈니스 에러 처리
     */
    if (!response.ok && isApiResponse(parsed) && !parsed.success) {
      const message = parsed.message || '요청에 실패했습니다.';
      toastStore.getState().showErrorToast(message);
      throw new Error(message);
    }

    return parsed;
  }

  private static async serverRequest<T>(
    url: string,
    method: HttpMethod,
    body?: unknown,
  ): Promise<T> {
    const baseUrl = process.env.NEXT_PUBLIC_API_SERVER_URL;
    const absoluteUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

    const requestInit: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    };

    if (!IS.nil(body)) requestInit.body = JSON.stringify(body);

    const response = await fetch(absoluteUrl, requestInit);

    if (!response.ok) {
      throw new Error(`Server request failed: ${response.status}`);
    }

    if (response.status === 204) {
      return { success: true, message: 'No Content' } as T;
    }

    return response.json() as Promise<T>;
  }

  static async get<T>(url: string, options?: HttpRequestOptions): Promise<T> {
    if (options?.server) return this.serverRequest<T>(url, 'GET');
    return this.request<T>(url, 'GET');
  }

  static async post<T>(url: string, data?: unknown, options?: HttpRequestOptions): Promise<T> {
    if (options?.server) return this.serverRequest<T>(url, 'POST', data);
    return this.request<T>(url, 'POST', data);
  }

  static async put<T>(url: string, data?: unknown, options?: HttpRequestOptions): Promise<T> {
    if (options?.server) return this.serverRequest<T>(url, 'PUT', data);
    return this.request<T>(url, 'PUT', data);
  }

  static async patch<T>(url: string, data?: unknown, options?: HttpRequestOptions): Promise<T> {
    if (options?.server) return this.serverRequest<T>(url, 'PATCH', data);
    return this.request<T>(url, 'PATCH', data);
  }

  static async delete<T>(url: string, options?: HttpRequestOptions): Promise<T> {
    if (options?.server) return this.serverRequest<T>(url, 'DELETE');
    return this.request<T>(url, 'DELETE');
  }
}
