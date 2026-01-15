import { HttpService } from '@/app/services/http.service';
import { ApiResponse } from '@/app/features/room/services/type';

export interface User {
  id: string;
  nickname: string;
  profileImage?: string;
}

interface MockLoginResponse {
  success: boolean;
  message?: string;
  token: string;
  userId: string;
  user: {
    id: string;
    email: string;
    nickname: string;
    profile_image: string | null;
    role: 'USER' | 'ADMIN';
  };
}

export class UserService {
  /**
   * 현재 인증된 사용자 정보 조회
   * GET /api/auth/me
   * @param token 인증 토큰 (authStore에서 전달)
   */
  static async getMe(token: string): Promise<User> {
    return HttpService.get<User>('/api/auth/me', token);
  }

  /**
   * 특정 사용자 정보 조회
   * GET /api/users/:userId/profile
   */
  static async getUserById(userId: string): Promise<User> {
    return HttpService.get<User>(`/api/users/${userId}/profile`);
  }

  /**
   * Mock 로그인
   * POST /api/auth/mock/login
   * @param userId Mock 사용자 ID
   */
  static async mockLogin(userId: string): Promise<MockLoginResponse> {
    const response = await HttpService.post<ApiResponse<MockLoginResponse>>(
      '/api/auth/mock/login',
      { userId },
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || '로그인에 실패했습니다.');
    }
    return response.data;
  }
}

const userService = new UserService();
export default userService;
