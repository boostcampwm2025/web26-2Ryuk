import { APIRequestContext } from '@playwright/test';

/**
 * API 서버 기본 URL
 */
const API_BASE_URL = 'http://localhost:4000';

/**
 * API 호출 헬퍼 함수
 */
export class ApiHelper {
  constructor(private request: APIRequestContext) {}

  /**
   * GET 요청
   */
  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    const response = await this.request.get(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
    return response.json();
  }

  /**
   * POST 요청
   */
  async post<T>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<T> {
    const response = await this.request.post(`${API_BASE_URL}${endpoint}`, {
      data: body,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
    return response.json();
  }

  /**
   * PUT 요청
   */
  async put<T>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<T> {
    const response = await this.request.put(`${API_BASE_URL}${endpoint}`, {
      data: body,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
    return response.json();
  }

  /**
   * PATCH 요청
   */
  async patch<T>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<T> {
    const response = await this.request.patch(`${API_BASE_URL}${endpoint}`, {
      data: body,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
    return response.json();
  }

  /**
   * DELETE 요청
   */
  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    const response = await this.request.delete(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
    return response.json();
  }

  /**
   * 인증 토큰을 포함한 헤더 생성
   */
  getAuthHeaders(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
    };
  }
}
