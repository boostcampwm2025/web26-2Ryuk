import { HttpService } from '@/app/services/http.service';
import { API_BASE } from '@/app/services/api.constants';
import {
  RoomDto,
  RoomCreateRequestDto,
  RoomUpdateRequestDto,
  RoomJoinInfoDto,
  RoomValidateJoinResponseDto,
  RoomListDto,
} from '@/app/features/room/dtos/dto';
import { RoomValidateJoinRequestData } from '@/app/features/room/dtos/data';
import { ApiResponse, IdDto } from './type';

export class RoomService {
  /**
   * 전체 방 목록 조회
   * GET /api/rooms/all
   */
  async getRooms(): Promise<RoomListDto> {
    const uri = `${API_BASE}/rooms/all`;
    const response = await HttpService.get<ApiResponse<RoomListDto>>(uri);
    if (!response.data) return { rooms: [] };
    if (!response.success) throw new Error(response.message);
    return response.data;
  }

  /**
   * 방 검색
   * GET /api/rooms/search
   */
  async searchRooms(keyword: string): Promise<RoomListDto> {
    const uri = `${API_BASE}/rooms/search?keyword=${keyword}`;
    const response = await HttpService.get<ApiResponse<RoomListDto>>(uri);
    if (!response.data) return { rooms: [] };
    if (!response.success) throw new Error(response.message);
    return response.data;
  }

  /**
   * 내 현재 방 조회
   * GET /api/rooms/me
   */
  async getMyCurrentRoom(): Promise<{ roomId?: string }> {
    const uri = `${API_BASE}/rooms/me`;
    const response = await HttpService.get<ApiResponse<{ roomId: string | null }>>(uri);
    if (!response.success) throw new Error(response.message);
    return { roomId: response.data?.roomId ?? undefined };
  }

  /**
   * 단일 방 정보 조회
   * GET /api/rooms/:roomId
   */
  async getRoom(roomId: string): Promise<RoomDto> {
    const uri = `${API_BASE}/rooms/${roomId}`;
    const response = await HttpService.get<ApiResponse<RoomDto>>(uri);
    if (!response.success || !response.data) throw new Error(response.message);
    return response.data;
  }

  /**
   * 방 입장 정보 조회
   * GET /api/rooms/:roomId/join
   */
  async getRoomJoinInfo(roomId: string): Promise<RoomJoinInfoDto> {
    const uri = `${API_BASE}/rooms/${roomId}/join`;
    const response = await HttpService.get<ApiResponse<RoomJoinInfoDto>>(uri);
    if (!response.success || !response.data) throw new Error(response.message);
    return response.data;
  }

  /**
   * 방 생성
   * POST /api/rooms
   */
  async createRoom(data: RoomCreateRequestDto): Promise<RoomDto> {
    const uri = `${API_BASE}/rooms`;
    const payload = data;
    const response = await HttpService.post<ApiResponse<RoomDto>>(uri, payload);
    if (!response.success || !response.data) throw new Error(response.message);
    return response.data;
  }

  /**
   * 방 정보 수정
   * PATCH /api/rooms/:roomId
   */
  async updateRoom(roomId: string, data: RoomUpdateRequestDto): Promise<RoomDto> {
    const uri = `${API_BASE}/rooms/${roomId}`;
    const payload = data;
    const response = await HttpService.patch<ApiResponse<RoomDto>>(uri, payload);
    if (!response.success || !response.data) throw new Error(response.message);
    return response.data;
  }

  /**
   * 방 삭제
   * DELETE /api/rooms/:roomId
   */
  async deleteRoom(roomId: string): Promise<void> {
    const uri = `${API_BASE}/rooms/${roomId}`;
    const response = await HttpService.delete<ApiResponse<IdDto>>(uri);
    if (!response.success) throw new Error(response.message);
  }

  /**
   * 입장 검증
   * POST /api/rooms/:roomId/validate-join
   */
  async validateJoin(roomId: string, password: string = ''): Promise<RoomValidateJoinResponseDto> {
    const uri = `${API_BASE}/rooms/${roomId}/validate-join`;
    const payload: RoomValidateJoinRequestData = { password };
    const response = await HttpService.post<ApiResponse<RoomValidateJoinResponseDto>>(uri, payload);
    if (!response.success || !response.data) throw new Error(response.message);
    return response.data;
  }
}

const roomService = new RoomService();
export default roomService;
