import { HttpService } from '@/app/services/http.service';
import {
  RoomDto,
  RoomCreateRequestDto,
  RoomUpdateRequestDto,
  RoomJoinInfoDto,
  RoomValidateJoinResponseDto,
  RoomListDto,
} from '@/app/features/room/dtos/dto';
import { RoomValidateJoinRequestData } from '@/app/features/room/dtos/data';
import { authStore } from '@/app/features/user/stores/auth';
import { ApiResponse, IdDto } from './type';

export class RoomService {
  async getRooms(): Promise<RoomListDto> {
    const uri = '/api/rooms/all';
    const response = await HttpService.get<ApiResponse<RoomListDto>>(uri);
    if (!response.data) return { rooms: [] };
    if (!response.success) throw new Error(response.message);
    return response.data;
  }

  async searchRooms(keyword: string): Promise<RoomListDto> {
    const uri = `/api/rooms/search?keyword=${keyword}`;
    const response = await HttpService.get<ApiResponse<RoomListDto>>(uri);
    if (!response.data) return { rooms: [] };
    if (!response.success) throw new Error(response.message);
    return response.data;
  }

  async getMyCurrentRoom(): Promise<{ roomId: string | null }> {
    const uri = '/api/rooms/me';
    const token = authStore.getState().token || undefined;
    const response = await HttpService.get<ApiResponse<{ roomId: string | null }>>(uri, token);
    if (!response.success) throw new Error(response.message);
    return { roomId: response.data?.roomId ?? null };
  }

  async getRoom(roomId: string): Promise<RoomDto> {
    const uri = `/api/rooms/${roomId}`;
    const response = await HttpService.get<ApiResponse<RoomDto>>(uri);
    if (!response.success || !response.data) throw new Error(response.message);
    return response.data;
  }

  async getRoomJoinInfo(roomId: string): Promise<RoomJoinInfoDto> {
    const uri = `/api/rooms/${roomId}/join`;
    const token = authStore.getState().token || undefined;
    const response = await HttpService.get<ApiResponse<RoomJoinInfoDto>>(uri, token);
    if (!response.success || !response.data) throw new Error(response.message);
    return response.data;
  }

  async createRoom(data: RoomCreateRequestDto): Promise<RoomDto> {
    const uri = '/api/rooms';
    const token = authStore.getState().token || undefined;
    const response = await HttpService.post<ApiResponse<RoomDto>>(uri, data, token);
    if (!response.success || !response.data) throw new Error(response.message);
    return response.data;
  }

  async updateRoom(roomId: string, data: RoomUpdateRequestDto): Promise<RoomDto> {
    const uri = `/api/rooms/${roomId}`;
    const token = authStore.getState().token || undefined;
    const response = await HttpService.patch<ApiResponse<RoomDto>>(uri, data, token);
    if (!response.success || !response.data) throw new Error(response.message);
    return response.data;
  }

  async deleteRoom(roomId: string): Promise<void> {
    const uri = `/api/rooms/${roomId}`;
    const token = authStore.getState().token || undefined;
    const response = await HttpService.delete<ApiResponse<IdDto>>(uri, token);
    if (!response.success) throw new Error(response.message);
  }

  async validateJoin(roomId: string, password: string = ''): Promise<RoomValidateJoinResponseDto> {
    const uri = `/api/rooms/${roomId}/validate-join`;
    const data: RoomValidateJoinRequestData = { password };
    const token = authStore.getState().token || undefined;
    const response = await HttpService.post<ApiResponse<RoomValidateJoinResponseDto>>(
      uri,
      data,
      token,
    );
    if (!response.success || !response.data) throw new Error(response.message);
    return response.data;
  }
}

const roomService = new RoomService();
export default roomService;
