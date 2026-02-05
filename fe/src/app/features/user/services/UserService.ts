import { HttpService } from '@/app/services/http.service';
import { API_BASE } from '@/app/services/api.constants';
import { ApiResponse } from '@/app/features/room/services/type';
import type { MockLoginResponseDto, UserDto } from '../dtos/dto';

export class UserService {
  /**
   * 현재 인증된 사용자 정보 조회
   * GET /api/auth/me
   */
  static async getMe(): Promise<UserDto> {
    const uri = `${API_BASE}/auth/me`;
    const response = await HttpService.get<ApiResponse<UserDto>>(uri);
    if (!response.success || !response.data) {
      throw new Error(response.message || '사용자 정보 조회에 실패했습니다.');
    }
    return response.data;
  }

  /**
   * 특정 사용자 정보 조회
   * GET /api/users/:userId/profile
   */
  static async getUserById(userId: string): Promise<UserDto> {
    const uri = `${API_BASE}/users/${userId}/profile`;
    const response = await HttpService.get<ApiResponse<UserDto>>(uri);
    if (!response.success || !response.data) {
      throw new Error(response.message || '사용자 정보 조회에 실패했습니다.');
    }
    return response.data;
  }

  /**
   * 개발용 Mock 로그인. 응답: access_token + user (snake_case DTO).
   */
  static async mockLogin(userId: string): Promise<MockLoginResponseDto> {
    const uri = `${API_BASE}/auth/mock/login`;
    const payload = { userId };
    const response = await HttpService.post<ApiResponse<MockLoginResponseDto>>(uri, payload);
    if (!response.success || !response.data) {
      throw new Error(response.message || '로그인에 실패했습니다.');
    }
    return response.data;
  }
}

const userService = new UserService();
export default userService;
