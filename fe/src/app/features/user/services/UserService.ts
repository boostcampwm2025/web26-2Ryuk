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
   */
  static async getMe(): Promise<User> {
    const response =
      await HttpService.get<ApiResponse<{ id: string; nickname: string; avatar: string | null }>>(
        '/api/auth/me',
      ); // 백엔드 응답 타입 명시
    if (!response.success || !response.data) {
      throw new Error(response.message || '사용자 정보 조회에 실패했습니다.');
    }
    // 필드명 매핑
    return {
      id: response.data.id,
      nickname: response.data.nickname,
      profileImage: response.data.avatar ?? undefined,
    };
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
